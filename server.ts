import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mongoose from "mongoose";
import { analyzeMedicalText } from "./src/services/nlpService.ts";

// Mock MongoDB if connection fails or URI is missing
// In a real environment, you'd use a real MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/amhrs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Connect to MongoDB (with fallback for environment without local mongo)
  let isMongoConnected = false;
  console.log("GEMINI_API_KEY is set:", !!process.env.GEMINI_API_KEY);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    isMongoConnected = true;
  } catch (err) {
    console.warn("MongoDB connection failed. Using in-memory mock storage for demo.");
  }

  // Patient Schema
  const patientSchema = new mongoose.Schema({
    patient_id: String,
    name: String,
    age: Number,
    gender: String,
    symptoms: [String],
    diagnosis: String,
    medications: [String],
    riskLevel: String,
    status: { type: String, default: 'Active' }, // Active, Blocked
    createdAt: { type: Date, default: Date.now }
  });

  const Patient = mongoose.model("Patient", patientSchema);

  // EHR Record Schema
  const ehrSchema = new mongoose.Schema({
    patient_id: String,
    patient_name: String,
    age: Number,
    gender: String,
    symptoms: [String],
    diagnosis: String,
    medications: [String],
    riskLevel: String,
    summary: String,
    rawText: String,
    createdAt: { type: Date, default: Date.now }
  });

  const EHRRecord = mongoose.model("EHRRecord", ehrSchema);

  // Request Schema
  const requestSchema = new mongoose.Schema({
    id: String,
    type: String, // EHR_EDIT, EHR_DELETE, PATIENT_EDIT, PATIENT_DELETE
    requesterId: String,
    requesterName: String,
    requesterRole: String,
    targetId: String,
    targetName: String,
    data: Object,
    status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
    createdAt: { type: Date, default: Date.now }
  });

  const RequestModel = mongoose.model("Request", requestSchema);

  // Activity Schema
  const activitySchema = new mongoose.Schema({
    patient_id: String,
    action: String, // 'ANALYSIS', 'EDIT_EHR', 'DELETE_EHR', 'EDIT_PATIENT', 'DELETE_PATIENT', 'STATUS_CHANGE', 'IMPORT'
    details: String,
    userId: String,
    userName: String,
    userRole: String,
    createdAt: { type: Date, default: Date.now }
  });

  const Activity = mongoose.model("Activity", activitySchema);

  // User Schema for RBAC
  const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    role: String,
    password: String,
    status: { type: String, default: 'Active' } // Active, Blocked
  });

  const User = mongoose.model("User", userSchema);

  // Mock Users for RBAC Demo
  let mockUsers: any[] = [
    { id: 'admin', name: 'System Admin', email: 'admin@amhrs.com', role: 'Administrator', password: 'admin123', status: 'Active' },
    { id: 'D101', name: 'John Smith', email: 'john@amhrs.com', role: 'Doctor', password: 'john101', status: 'Active' },
    { id: 'N201', name: 'Joy Nurse', email: 'joy@amhrs.com', role: 'Nurse', password: 'joy201', status: 'Active' }
  ];

  let mockEHRRecords: any[] = [];
  let mockRequests: any[] = [];
  let mockActivities: any[] = [];

  // Helper to log activities
  const logActivity = async (data: { patient_id?: string, action: string, details: string, req: express.Request }) => {
    const userRole = data.req.headers['x-user-role'] as string;
    const userId = data.req.headers['x-user-id'] as string;
    
    // Find user name
    let userName = 'Unknown User';
    if (userId) {
      const user = isMongoConnected 
        ? await User.findOne({ id: userId }) 
        : mockUsers.find(u => u.id === userId);
      if (user) userName = user.name;
      else if (userRole === 'Patient') {
        const patient = isMongoConnected
          ? await Patient.findOne({ patient_id: userId })
          : mockPatients.find(p => p.patient_id === userId);
        if (patient) userName = patient.name;
      }
    }

    const activityData = {
      patient_id: data.patient_id || 'SYSTEM',
      action: data.action,
      details: data.details,
      userId,
      userName,
      userRole,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      const activity = new Activity(activityData);
      await activity.save();
    } else {
      mockActivities.unshift({ ...activityData, _id: Math.random().toString(36).substr(2, 9) });
    }
  };

  // RBAC Middleware
  const authorize = (roles: string[]) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const userRole = req.headers['x-user-role'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!userRole) {
        console.warn(`Unauthorized access attempt: No role provided for ${req.method} ${req.path}`);
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!roles.includes(userRole)) {
        console.warn(`Forbidden access attempt: Role ${userRole} tried to access ${req.method} ${req.path}. Allowed roles: ${roles.join(', ')}`);
        return res.status(403).json({ error: "Forbidden" });
      }

      // Check if user is blocked
      if (userId) {
        try {
          if (userRole === 'Patient') {
            const patient = isMongoConnected
              ? await Patient.findOne({ patient_id: userId })
              : mockPatients.find(p => p.patient_id === userId);
            
            if (patient && patient.status === 'Blocked') {
              console.warn(`Blocked patient access attempt: ${userId}`);
              return res.status(403).json({ error: "Patient access blocked" });
            }
          } else {
            const user = isMongoConnected 
              ? await User.findOne({ id: userId }) 
              : mockUsers.find(u => u.id === userId);
            
            if (user && user.status === 'Blocked') {
              console.warn(`Blocked staff access attempt: ${userId} (${userRole})`);
              return res.status(403).json({ error: "Account is blocked" });
            }
          }
        } catch (error) {
          console.error("Error checking blocked status:", error);
          // Continue if check fails, or decide if you want to block by default
        }
      }

      next();
    };
  };

  // In-memory fallback if Mongo is not available
  let mockPatients: any[] = [
    {
      patient_id: "P001",
      name: "John Doe",
      age: 65,
      gender: "Male",
      symptoms: ["Chest pain", "Shortness of breath"],
      diagnosis: "Suspected Angina",
      medications: ["Aspirin", "Atorvastatin"],
      riskLevel: "High",
      status: "Active",
      createdAt: new Date()
    },
    {
      patient_id: "P002",
      name: "Jane Smith",
      age: 28,
      gender: "Female",
      symptoms: ["Fever", "Cough"],
      diagnosis: "Common Cold",
      medications: ["Paracetamol"],
      riskLevel: "Low",
      status: "Active",
      createdAt: new Date()
    }
  ];

  // API Routes
  app.get("/api/patients", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    if (isMongoConnected) {
      const patients = await Patient.find().sort({ createdAt: -1 });
      res.json(patients);
    } else {
      res.json(mockPatients);
    }
  });

  app.post("/api/patients", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const patientData = req.body;
    if (isMongoConnected) {
      const newPatient = new Patient(patientData);
      await newPatient.save();
      await logActivity({ patient_id: newPatient.patient_id, action: 'EDIT_PATIENT', details: 'New patient record created', req });
      res.status(201).json(newPatient);
    } else {
      const newPatient = { ...patientData, _id: Math.random().toString(36).substr(2, 9), createdAt: new Date() };
      mockPatients.unshift(newPatient);
      await logActivity({ patient_id: newPatient.patient_id, action: 'EDIT_PATIENT', details: 'New patient record created', req });
      res.status(201).json(newPatient);
    }
  });

  app.post("/api/nlp", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const { text, patient_id, patient_name } = req.body;
    try {
      const analysis = await analyzeMedicalText(text);
      const ehrData = {
        ...analysis,
        rawText: text,
        patient_id: patient_id || 'Unknown',
        patient_name: patient_name || 'Unknown',
        createdAt: new Date()
      };

      if (isMongoConnected) {
        const newEHR = new EHRRecord(ehrData);
        await newEHR.save();
        await logActivity({ patient_id: patient_id || 'Unknown', action: 'ANALYSIS', details: 'Automated NLP analysis performed', req });
        res.json(newEHR);
      } else {
        const newEHR = { ...ehrData, _id: Math.random().toString(36).substr(2, 9) };
        mockEHRRecords.unshift(newEHR);
        await logActivity({ patient_id: patient_id || 'Unknown', action: 'ANALYSIS', details: 'Automated NLP analysis performed', req });
        res.json(newEHR);
      }
    } catch (error) {
      console.error("NLP Error:", error);
      res.status(500).json({ error: "Failed to analyze text" });
    }
  });

  app.get("/api/ehr", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    if (isMongoConnected) {
      const records = await EHRRecord.find().sort({ createdAt: -1 });
      res.json(records);
    } else {
      res.json(mockEHRRecords);
    }
  });

  app.patch("/api/ehr/:id", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = req.headers['x-user-role'] as string;

    // Doctor/Nurse needs approval
    if ((userRole === 'Doctor' || userRole === 'Nurse') && !updateData.isApproved) {
      return res.status(403).json({ error: `${userRole}s need administrator approval to edit EHR records` });
    }

    if (isMongoConnected) {
      const record = await EHRRecord.findByIdAndUpdate(id, updateData, { new: true });
      if (!record) return res.status(404).json({ error: "EHR Record not found" });
      await logActivity({ patient_id: record.patient_id, action: 'EDIT_EHR', details: 'EHR record updated', req });
      res.json(record);
    } else {
      const index = mockEHRRecords.findIndex(r => r._id === id);
      if (index === -1) return res.status(404).json({ error: "EHR Record not found" });
      mockEHRRecords[index] = { ...mockEHRRecords[index], ...updateData };
      await logActivity({ patient_id: mockEHRRecords[index].patient_id, action: 'EDIT_EHR', details: 'EHR record updated', req });
      res.json(mockEHRRecords[index]);
    }
  });

  app.delete("/api/ehr/:id", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;
    const isApproved = req.query.isApproved === 'true';

    if ((userRole === 'Doctor' || userRole === 'Nurse') && !isApproved) {
      return res.status(403).json({ error: `${userRole}s need administrator approval to delete EHR records` });
    }

    if (isMongoConnected) {
      const record = await EHRRecord.findById(id);
      if (record) {
        await logActivity({ patient_id: record.patient_id, action: 'DELETE_EHR', details: 'EHR record deleted', req });
        await EHRRecord.findByIdAndDelete(id);
      }
      res.status(204).send();
    } else {
      const record = mockEHRRecords.find(r => r._id === id);
      if (record) {
        await logActivity({ patient_id: record.patient_id, action: 'DELETE_EHR', details: 'EHR record deleted', req });
        mockEHRRecords = mockEHRRecords.filter(r => r._id !== id);
      }
      res.status(204).send();
    }
  });

  // Request Management Routes
  app.get("/api/requests", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const userRole = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (isMongoConnected) {
      let query = {};
      if (userRole === 'Nurse') {
        query = { requesterId: userId };
      }
      const requests = await RequestModel.find(query).sort({ createdAt: -1 });
      res.json(requests);
    } else {
      let requests = mockRequests;
      if (userRole === 'Nurse') {
        requests = mockRequests.filter(r => r.requesterId === userId);
      }
      res.json(requests);
    }
  });

  app.post("/api/requests", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const requestData = req.body;
    if (isMongoConnected) {
      const newRequest = new RequestModel(requestData);
      await newRequest.save();
      res.status(201).json(newRequest);
    } else {
      const newRequest = { ...requestData, _id: Math.random().toString(36).substr(2, 9), createdAt: new Date() };
      mockRequests.unshift(newRequest);
      res.status(201).json(newRequest);
    }
  });

  app.patch("/api/requests/:id", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (isMongoConnected) {
      const request = await RequestModel.findById(id);
      if (!request) return res.status(404).json({ error: "Request not found" });

      // Only Admin/Doctor can approve/reject
      if (userRole === 'Nurse' && (status === 'Approved' || status === 'Rejected')) {
        return res.status(403).json({ error: "Nurses cannot approve or reject requests" });
      }

      // Nurses can only update their own requests to 'Completed'
      if (userRole === 'Nurse' && request.requesterId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      request.status = status;
      await request.save();
      res.json(request);
    } else {
      const index = mockRequests.findIndex(r => r._id === id);
      if (index === -1) return res.status(404).json({ error: "Request not found" });

      if (userRole === 'Nurse' && (status === 'Approved' || status === 'Rejected')) {
        return res.status(403).json({ error: "Nurses cannot approve or reject requests" });
      }

      if (userRole === 'Nurse' && mockRequests[index].requesterId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      mockRequests[index].status = status;
      res.json(mockRequests[index]);
    }
  });

  app.post("/api/import", authorize(['Administrator']), async (req, res) => {
    const { dataset } = req.body; // Array of patients
    if (isMongoConnected) {
      await Patient.insertMany(dataset);
      await logActivity({ action: 'IMPORT', details: `Imported ${dataset.length} patient records`, req });
      res.json({ message: "Dataset imported successfully" });
    } else {
      mockPatients = [...dataset, ...mockPatients];
      await logActivity({ action: 'IMPORT', details: `Imported ${dataset.length} patient records`, req });
      res.json({ message: "Dataset imported successfully" });
    }
  });

  app.post("/api/import/ehr", authorize(['Administrator']), async (req, res) => {
    const { dataset } = req.body; // Array of EHR records
    if (isMongoConnected) {
      await EHRRecord.insertMany(dataset);
      await logActivity({ action: 'IMPORT', details: `Imported ${dataset.length} EHR records`, req });
      res.json({ message: "EHR Dataset imported successfully" });
    } else {
      mockEHRRecords = [...dataset, ...mockEHRRecords];
      await logActivity({ action: 'IMPORT', details: `Imported ${dataset.length} EHR records`, req });
      res.json({ message: "EHR Dataset imported successfully" });
    }
  });

  app.post("/api/login/staff", async (req, res) => {
    const { id, password } = req.body;
    const user = mockUsers.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: "Staff ID not found" });
    if (user.password !== password) return res.status(401).json({ error: "Invalid password" });
    if (user.status === 'Blocked') return res.status(403).json({ error: "Account is blocked" });
    res.json(user);
  });

  app.post("/api/login/patient", async (req, res) => {
    const { patient_id } = req.body;
    if (isMongoConnected) {
      const patient = await Patient.findOne({ patient_id });
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      if (patient.status === 'Blocked') return res.status(403).json({ error: "Patient access blocked" });
      res.json({ id: patient.patient_id, name: patient.name, email: `${patient.patient_id}@patient.amhrs.com`, role: 'Patient' });
    } else {
      const patient = mockPatients.find(p => p.patient_id === patient_id);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      if (patient.status === 'Blocked') return res.status(403).json({ error: "Patient access blocked" });
      res.json({ id: patient.patient_id, name: patient.name, email: `${patient.patient_id}@patient.amhrs.com`, role: 'Patient' });
    }
  });

  app.get("/api/patients/:id", authorize(['Administrator', 'Doctor', 'Nurse', 'Patient']), async (req, res) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;

    // Patients can only view their own data
    if (userRole === 'Patient' && userId !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (isMongoConnected) {
      const patient = await Patient.findOne({ patient_id: id });
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      res.json(patient);
    } else {
      const patient = mockPatients.find(p => p.patient_id === id);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      res.json(patient);
    }
  });

  app.patch("/api/patients/:id", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = req.headers['x-user-role'] as string;

    if (userRole === 'Nurse' && !updateData.isApproved) {
      return res.status(403).json({ error: "Nurses need doctor approval to edit patient records" });
    }
    if (isMongoConnected) {
      const patient = await Patient.findOneAndUpdate({ patient_id: id }, updateData, { new: true });
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      await logActivity({ patient_id: id, action: 'EDIT_PATIENT', details: 'Patient record updated', req });
      res.json(patient);
    } else {
      const index = mockPatients.findIndex(p => p.patient_id === id);
      if (index === -1) return res.status(404).json({ error: "Patient not found" });
      mockPatients[index] = { ...mockPatients[index], ...updateData };
      await logActivity({ patient_id: id, action: 'EDIT_PATIENT', details: 'Patient record updated', req });
      res.json(mockPatients[index]);
    }
  });

  app.delete("/api/patients/:id", authorize(['Administrator', 'Doctor', 'Nurse']), async (req, res) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;
    const isApproved = req.query.isApproved === 'true';

    if (userRole === 'Nurse' && !isApproved) {
      return res.status(403).json({ error: "Nurses need doctor approval to delete patient records" });
    }
    if (isMongoConnected) {
      await logActivity({ patient_id: id, action: 'DELETE_PATIENT', details: 'Patient record deleted', req });
      await Patient.findOneAndDelete({ patient_id: id });
      res.status(204).send();
    } else {
      await logActivity({ patient_id: id, action: 'DELETE_PATIENT', details: 'Patient record deleted', req });
      mockPatients = mockPatients.filter(p => p.patient_id !== id);
      res.status(204).send();
    }
  });

  app.patch("/api/patients/:id/status", authorize(['Administrator', 'Doctor']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (isMongoConnected) {
      const patient = await Patient.findOneAndUpdate({ patient_id: id }, { status }, { new: true });
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      await logActivity({ patient_id: id, action: 'STATUS_CHANGE', details: `Patient status changed to ${status}`, req });
      res.json(patient);
    } else {
      const index = mockPatients.findIndex(p => p.patient_id === id);
      if (index === -1) return res.status(404).json({ error: "Patient not found" });
      mockPatients[index].status = status;
      await logActivity({ patient_id: id, action: 'STATUS_CHANGE', details: `Patient status changed to ${status}`, req });
      res.json(mockPatients[index]);
    }
  });

  app.get("/api/patients/:id/activities", authorize(['Administrator', 'Doctor']), async (req, res) => {
    const { id } = req.params;
    if (isMongoConnected) {
      const activities = await Activity.find({ patient_id: id }).sort({ createdAt: -1 });
      res.json(activities);
    } else {
      const activities = mockActivities.filter(a => a.patient_id === id);
      res.json(activities);
    }
  });

  // API Routes for User Management
  app.get("/api/users", authorize(['Administrator', 'Doctor']), async (req, res) => {
    const userRole = req.headers['x-user-role'] as string;
    
    let users = isMongoConnected ? await User.find() : mockUsers;
    
    // Doctors can only see Nurses and Patients (Wait, Patients aren't in User collection usually)
    // Actually, user said "give access to doctor to add and block and delete nurse, patients"
    // So Doctors can manage Nurses in the User collection.
    if (userRole === 'Doctor') {
      users = users.filter(u => u.role === 'Nurse');
    }

    res.json(users);
  });

  app.post("/api/users", authorize(['Administrator', 'Doctor']), async (req, res) => {
    const userData = req.body;
    const userRole = req.headers['x-user-role'] as string;

    // Doctors can only add Nurses
    if (userRole === 'Doctor' && userData.role !== 'Nurse') {
      return res.status(403).json({ error: "Doctors can only add Nurses" });
    }

    if (isMongoConnected) {
      const newUser = new User(userData);
      await newUser.save();
      res.status(201).json(newUser);
    } else {
      mockUsers.push(userData);
      res.status(201).json(userData);
    }
  });

  app.delete("/api/users/:id", authorize(['Administrator', 'Doctor']), async (req, res) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;

    if (isMongoConnected) {
      const user = await User.findOne({ id });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (userRole === 'Doctor' && user.role !== 'Nurse') {
        return res.status(403).json({ error: "Doctors can only delete Nurses" });
      }
      await User.findOneAndDelete({ id });
      res.status(204).send();
    } else {
      const user = mockUsers.find(u => u.id === id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (userRole === 'Doctor' && user.role !== 'Nurse') {
        return res.status(403).json({ error: "Doctors can only delete Nurses" });
      }
      mockUsers = mockUsers.filter(u => u.id !== id);
      res.status(204).send();
    }
  });

  app.patch("/api/users/:id/status", authorize(['Administrator', 'Doctor']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.headers['x-user-role'] as string;

    if (isMongoConnected) {
      const user = await User.findOne({ id });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (userRole === 'Doctor' && user.role !== 'Nurse') {
        return res.status(403).json({ error: "Doctors can only block Nurses" });
      }
      user.status = status;
      await user.save();
      res.json(user);
    } else {
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex === -1) return res.status(404).json({ error: "User not found" });
      if (userRole === 'Doctor' && mockUsers[userIndex].role !== 'Nurse') {
        return res.status(403).json({ error: "Doctors can only block Nurses" });
      }
      mockUsers[userIndex].status = status;
      res.json(mockUsers[userIndex]);
    }
  });

  app.patch("/api/users/:id/role", authorize(['Administrator']), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (isMongoConnected) {
      const user = await User.findOneAndUpdate({ id }, { role }, { new: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } else {
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex === -1) return res.status(404).json({ error: "User not found" });
      mockUsers[userIndex].role = role;
      res.json(mockUsers[userIndex]);
    }
  });

  // Seed initial EHR data and Users if empty
  if (isMongoConnected) {
    const pCount = await Patient.countDocuments();
    if (pCount === 0) {
      await Patient.insertMany(mockPatients);
      console.log("Seeded initial EHR data");
    }
    
    const uCount = await User.countDocuments();
    if (uCount === 0) {
      await User.insertMany(mockUsers);
      console.log("Seeded initial User data");
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
