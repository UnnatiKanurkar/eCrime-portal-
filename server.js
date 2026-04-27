const express = require('express');
const pool = require('./db');
const multer = require("multer"); // 1. Import Multer
// const path = require("path");
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const admin = require("./firebase");
require("dotenv").config();

const fs = require("fs");
app.use(cors());
app.use(express.json());
// //  upload evidance
const path = require("path");

// const jwt = require("jsonwebtoken");

app.use(
  "/api/upload",
  express.static(path.join(__dirname, "upload"))
);





// // Home route
app.get('/', (req, res) => {
  res.send(`
    <h1>Simple Node.js + MySQL API</h1>
  `);

});


//===================================== District ================================================================================
// get and add district delete 

//get district
app.get('/api/getdistrict', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT *  FROM district_table');
    //Sends JSON response (automatically sets Content-Type: application/json) 
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});

// POST /adddistrict         → create new district
app.post('/api/adddistrict', async (req, res) => {
  const { district_name } = req.body;

  if (!district_name) {
    return res.status(400).json({ error: ' district  is required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO district_table ( district_name) VALUES (?)',
      [district_name]
    );

    const newdistrict = {
      id: result.insertId,
      success: true
    };

    res.status(201).json(newdistrict);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'district already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

//update district
// PUT /updatedistrict → update existing district
app.put('/api/updatedistrict/:id', async (req, res) => {
  const { id } = req.params;
  const { district_name } = req.body;

  if (!district_name) {
    return res.status(400).json({ error: 'district_name is required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE district_table SET district_name = ? WHERE id = ?',
      [district_name, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'District not found' });
    }

    res.status(200).json({
      success: true,
      message: 'District updated successfully'
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'District already exists' });
    }

    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

//delete distric
app.delete('/api/deletedistrict/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      'DELETE FROM district_table WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'district not found' });
    }

    res.json({ message: 'District deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

//===========================================  zone  ==========================================================================================

// get add delete zone 
// 🔹 Add Zone
app.post('/api/addzone', async (req, res) => {
  const { name, district_id } = req.body;

  if (!name || !district_id) {
    return res.status(400).json({ error: ' name and district are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO zone_table (name,district_id) VALUES (?, ? )',
      [name, district_id]

    );

    const newzone = {
      id: result.insertId,
      success: true
    };

    res.status(201).json(newzone);
  } catch (err) {
    console.log(err)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'zone already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

//fetch zone 
app.get('/api/getzone', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * from zone_table ');
    //Sends JSON response (automatically sets Content-Type: application/json)
    res.json({
      success: true,


      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});
//update zone
app.put('/api/updatezone/:id', async (req, res) => {
  const { id } = req.params;
  const { name, district_id } = req.body;

  if (!name || !district_id) {
    return res.status(400).json({ error: 'zone is required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE zone_table SET name = ?, district_id = ? WHERE id = ?',
      [name, district_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'zone not found' });
    }

    res.status(200).json({
      success: true,
      message: 'zone updated successfully'
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'zone already exists' });
    }

    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

//delete zone
app.delete('/api/deletedzone/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      'DELETE FROM zone_table WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'zone not found' });
    }

    res.json({ message: 'zone deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

//============================================= City ============================================================================================

//get zone by district in dropdown _city

app.post('/api/getzonebydistrictid/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * from zone_table where district_id = ? ', [id]);
    //Sends JSON response (automatically sets Content-Type: application/json)
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});

//  add  city
app.post('/api/addcity', async (req, res) => {
  const { district_id, zone_id, city_name } = req.body;

  if (!district_id || !zone_id || !city_name) {
    return res.status(400).json({ error: ' district_id , zone_id , city_name  are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO city_table (district_id , zone_id, city_name) VALUES (?, ? ,? )',
      [district_id, zone_id, city_name]

    );

    const newcity = {
      id: result.insertId,
      success: true
    };

    res.status(201).json(newcity);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'city already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// get all cities
app.get("/api/getcity", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM city_table");
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


// Update city
app.put('/api/updatecity/:id', async (req, res) => {
  const cityId = Number(req.params.id); // id convert to number
  const { district_id, zone_id, city_name } = req.body;

  // 🔹 Validation
  if (!district_id || !zone_id || !city_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE city_table SET district_id = ?, zone_id = ?, city_name = ? WHERE id = ?',
      [Number(district_id), Number(zone_id), city_name, cityId]
    );

    // 🔹 Check if any row was updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.status(200).json({
      success: true,
      message: 'City updated successfully'
    });

  } catch (err) {
    // 🔹 Handle duplicate entry (if city_name has unique constraint)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'City already exists' });
    }

    console.error('SQL ERROR:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

//deleted city
app.delete('/api/deletecity/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM city_table WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.status(200).json({
      success: true,
      message: 'City deleted successfully'
    });

  } catch (err) {
    console.error('Delete City Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


//============================================ area  ========================================================================

//get city by zone id 

app.post('/api/getcitybyzoneid/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id ,city_name from city_table where zone_id = ? ', [id]);
    //Sends JSON response (automatically sets Content-Type: application/json)
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});

//  add area 

app.post('/api/addarea', async (req, res) => {
  const { district_id, zone_id, city_id, area_name } = req.body;

  if (!district_id || !zone_id || !city_id || !area_name) {
    return res.status(400).json({ error: ' district_id , zone_id, city_id, area_name  are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO area_table (district_id , zone_id, city_id, area_name) VALUES (?, ? ,?,? )',
      [district_id, zone_id, city_id, area_name]

    );

    const newarea = {
      id: result.insertId,
      success: true
    };

    res.status(201).json(newarea);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'area already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


// get area records

app.get("/api/getarea", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM area_table");
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

//deleted area
app.delete('/api/deletearea/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM area_table WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'area not found' });
    }

    res.status(200).json({
      success: true,
      message: 'area deleted successfully'
    });

  } catch (err) {
    console.error('Delete area Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// Update area
app.put('/api/updatearea/:id', async (req, res) => {
  const areaId = Number(req.params.id); // id convert to number
  const { city_id, district_id, zone_id, area_name } = req.body;

  // 🔹 Validation
  if (!city_id || !district_id || !zone_id || !area_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE area_table SET city_id = ?, district_id = ?, zone_id = ? , area_name = ?  WHERE id = ?',
      [Number(city_id), Number(district_id), Number(zone_id), area_name, areaId]
    );

    // 🔹 Check if any row was updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'area not found' });
    }

    res.status(200).json({
      success: true,
      message: 'area updated successfully'
    });

  } catch (err) {
    // 🔹 Handle duplicate entry (if city_name has unique constraint)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'area already exists' });
    }

    console.error('SQL ERROR:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


//==========================================   crimetype =================================================

// add Crime Type
app.post("/api/addcrimetype", async (req, res) => {
  const { slug, typename, category } = req.body;

  if (!slug || !typename || !category) {
    return res.status(400).json({ error: "slug, typename and category are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO crimetype_table (slug, typename, category) VALUES (?, ?, ?)",
      [slug, typename, category]
    );

    const newCrime = {
      id: result.insertId,
      slug,
      typename,
      category,
      success: true,
    };

    res.status(201).json(newCrime);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Crime type already exists" });
    }
    console.error("Add crime type Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// fetch All Crime Types
app.get("/api/getcrimetypes", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM crimetype_table");
    res.json({ data: rows });
  } catch (err) {
    console.error("Get crime types Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE Crime Type
app.delete("/api/deletecrimetype/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM crimetype_table WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Crime type not found" });
    }

    res.status(200).json({ success: true, message: "Crime type deleted successfully" });
  } catch (err) {
    console.error("Delete crime type Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});



// crimetype
app.get("/crimetypes", async (req, res) => {
  const [rows] = await pool.query("SELECT id, typename FROM crimetype_table");
  res.json(rows); // [{id:1, typename:'Robbery'}, ...]
});

// UPDATE Crime Type
app.put("/api/updatecrimetype/:id", async (req, res) => {
  const crimeId = Number(req.params.id);
  const { slug, typename, category } = req.body;

  if (!slug || !typename || !category) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE crimetype_table SET slug = ?, typename = ?, category = ? WHERE id = ?",
      [slug, typename, category, crimeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Crime type not found" });
    }

    res.status(200).json({ success: true, message: "Crime type updated successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Crime type already exists" });
    }
    console.error("Update crime type Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

//================================================================== MAnage  policestation ============================================================


//get police station 
app.get("/api/getpolicestation", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM policestation_name");
    res.json({ data: rows });
  } catch (err) {
    console.error("Get policestation Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// // DELETE station 
app.delete("/api/deletepolice/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM policestation_name WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: " policestation not found" });
    }

    res.status(200).json({ success: true, message: " policestation deleted successfully" });
  } catch (err) {
    console.error("Delete station  Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// //  add final  policestation
app.post('/api/addpolicestation', async (req, res) => {
  const { name, district_id, zone_id, city_id, pincode, address, mobileno, jurisdiction, incharge, email, password } = req.body;

  if (!name || !district_id || !zone_id || !city_id || !pincode || !address || !mobileno || !jurisdiction || !incharge || !email || !password) {
    return res.status(400).json({ error: ' name , district_id, zone_id ,city_id ,pincode,address,mobileno , judridiction , incharge , email , password are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO policestation_name (name,district_id,zone_id,city_id,pincode,address,mobileno, jurisdiction,incharge,email , password) VALUES (?, ?,?,? ,? ,?,?, ?, ? ,? ,?)',
      [name, district_id, zone_id, city_id, pincode, address, mobileno, jurisdiction, incharge, email, password]

    );

    const newpolicestation = {
      id: result.insertId,
      success: true
    };

    res.status(201).json(newpolicestation);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'policestation already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// // UPDATE police station 4.2 changes
app.put('/api/updatepolicestation/:id', async (req, res) => {
  const policeId = Number(req.params.id); // id convert to number
  const { name, district_id, zone_id, city_id, pincode, address, mobileno, jurisdiction, incharge, email, password } = req.body;
  //console.log(mobileno);
  // console.log("update id :" ,policeId);
  // console.log(result);
  //console.log("BODY:", req.body);


  //  Validation
  if (!name || !district_id || !zone_id || !city_id || !pincode || !address || !mobileno || !jurisdiction || !incharge || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE policestation_name SET name = ?, district_id = ?, zone_id = ? , city_id = ? ,pincode=?,address=?,mobileno=?, jurisdiction =? ,incharge = ? ,email =? ,password=?  WHERE id = ?',
      [name, Number(district_id), Number(zone_id), Number(city_id), pincode, address, mobileno, jurisdiction, incharge, email, password, policeId]
    );

    //  Check if any row was updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'police station  not found' });
    }

    res.status(200).json({
      success: true,
      message: 'police station  updated successfully'
    });

  } catch (err) {

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'police station  already exists' });
    }

    console.error('SQL ERROR:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
//=========================================  fetch  users =======================================================

// Get users with district & city name
app.get("/api/userdetails", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.mobile,
        u.address,
        
        u.gender,
        u.birthdate,
        u.role,
        d.district_name,
        c.city_name
      FROM users u
      LEFT JOIN district_table d ON u.district_id = d.id
      LEFT JOIN city_table c ON u.city_id = c.id
    `);

    res.json({ data: rows });
  } catch (err) {
    console.error("Get users Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});
//===============================================================================================================



app.get("/police/profile/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        ps.id,
        ps.name,
        ps.email,
        ps.address,
         ps.incharge AS incharge_name,
        d.district_name AS district_name
      FROM policestation_name ps
      LEFT JOIN district_table d ON ps.district_id = d.id
      WHERE ps.email = ?
    `, [email]);

    if (rows.length === 0) {
      return res.json({ success: false, message: "Profile not found" });
    }

    res.json({
      success: true,
      data: rows[0],
    });

  } catch (error) {
    console.log("PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
//get approved complaint
// Get complaints for a police station
app.get("/api/investigation-list/:stationId", async (req, res) => {
  try {
    const { stationId } = req.params;

    const [rows] = await pool.query(
      `SELECT * 
       FROM complaint
       WHERE policestation_id = ?
       AND status IN ('approved','under_Investigation','reopen','closed')
       ORDER BY id DESC`,
      [stationId]
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Error in investigation-list:", err);
    res.status(500).json({ message: "Server error" });
  }
});



//================================================================================================================================ 
//======================================= user login =============================================================================================



// user login dynamic
//user login 
app.post('/api/addlogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: ' email and password  is required' });
  }

  try {
    const [result] = await pool.query(
      "SELECT * FROM users WHERE email= ?  password =  ?",
      [email, password]
    );

    const newlogin = {
      id: result.insertId,
      success: true
    };

    res.status(201).json(newlogin);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'login  already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


//==================================================
//==================================================
const aadhaarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = "upload/aadhaar";

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const uploadAadhaar = multer({
  storage: aadhaarStorage,
});

///======== Register ===============

app.post(
  "/api/users",

  uploadAadhaar.fields([
    { name: "aadhaar_front", maxCount: 1 },
    { name: "aadhaar_back", maxCount: 1 },
  ]),

  async (req, res) => {
    try {
      const {
        name,
        email,
        mobile,
        address,
        gender,
        birthdate,
        district_id,
        city_id,
        password,
      } = req.body;

      const role = "USER";

      // Check existing email
      const [existing] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (existing.length) {
        return res.status(400).json({
          error: "Email already registered",
        });
      }

      const aadhaarFrontFile =
        req.files?.aadhaar_front?.[0];

      const aadhaarBackFile =
        req.files?.aadhaar_back?.[0];

      if (!aadhaarFrontFile || !aadhaarBackFile) {
        return res.status(400).json({
          error: "Upload Aadhaar front and back images",
        });
      }

      const aadhaarFront =
        aadhaarFrontFile.filename;

      const aadhaarBack =
        aadhaarBackFile.filename;

      // INSERT USER FIRST (NOT VERIFIED)

      const [result] = await pool.query(
        `INSERT INTO users
        (
          name,
          email,
          mobile,
          address,
          aadhaar_front,
          aadhaar_back,
          gender,
          birthdate,
          district_id,
          city_id,
          password,
          role,
          is_verified
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          name,
          email,
          mobile,
          address,
          aadhaarFront,
          aadhaarBack,
          gender,
          birthdate,
          district_id,
          city_id,
          password,
          role,
        ]
      );

      const userId = result.insertId;

      // Create verification token

      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      const verificationUrl =
        `${process.env.BACKEND_URL}/api/verify-email?token=${token}`;

      const transporter =
        nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

      await transporter.sendMail({
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Email",
        html: `
          <p>Hi ${name},</p>
          <p>Click below to verify email:</p>
          <a href="${verificationUrl}">
            Verify Email
          </a>
        `,
      });

      res.status(201).json({
        success: true,
        message:
          "Registered successfully. Please verify email.",
      });

    } catch (error) {
      console.error("REGISTER ERROR:", error);

      res.status(500).json({
        error: "Server error",
      });
    }
  }
);

//=====================varifiaction==============
app.get("/api/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.send("Invalid link");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId = decoded.userId;

    await pool.query(
      `UPDATE users
       SET is_verified = 1
       WHERE id = ?`,
      [userId]
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/login`
    );

  } catch (error) {
    console.error(error);

    if (error.name === "TokenExpiredError") {
      return res.send("Verification link expired");
    }

    res.status(500).send("Server error");
  }
});

// Login API
// =======================
app.post("/api/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const sql =
      "SELECT id, name, email, password, role, mobile, is_verified FROM users WHERE email = ?";

    const [rows] = await pool.query(sql, [email]);

    // User not found
    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = rows[0];

    // Password check
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Email verification check
   if (!user.is_verified) {
  return res.status(401).json({
    message:
      "Email not verified. Please check your inbox."
  });
}
    // Login success
    res.json({
      message: "Login Successful",
      user: {
        userId: user.id,
        userName: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//-------------------------------
//userprofile
//--------------------------

app.get("/api/users/:id", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE id=?",
    [req.params.id]
  );

  res.json(rows[0]);
});



app.get("/api/getcomplaints/:role_id", async (req, res) => {
  try {
    const { role_id } = req.params; // ✅ correct

    if (!role_id) {
      return res.status(400).json({ error: "Police station ID required" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        c.id,
        c.complaintDate,
        c.incidentDate,
        c.victimName,
        c.details,
        c.relation,
        c.address,
        c.status,
        c.rejectionReason,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- ✅ MULTIPLE CRIME TYPES
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c
      LEFT JOIN district_table d ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id

      WHERE c.policestation_id = ?
      ORDER BY c.id DESC
      `,
      [role_id] // ✅ correct binding
    );

    res.json(rows);
  } catch (error) {
    console.error("SQL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

//----------------------------------
//Edit User Profile
//----------------------------------

// app.put('/api/updateuserprofile/:id', async (req, res) => {
//   const { id } = req.params;

//   // Only accept these two fields
//   const { mobile, address } = req.body;

//   // Validation
//   if (!mobile || !address) {
//     return res.status(400).json({
//       error: 'Mobile number and address are required'
//     });
//   }

//   try {
//     const [result] = await pool.query(
//       `UPDATE users 
//        SET mobile = ?, address = ?
//        WHERE id = ?`,
//       [mobile, address, id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully'
//     });

//   } catch (err) {
//     console.error('Database Error:', err);
//     res.status(500).json({ error: 'Database error occurred while updating profile' });
//   }
// });


/////evidance
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. STORAGE CONFIGURATION (Define this FIRST)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type; // image | video | audio
    let folder = "upload/document"; 

    if (type === "image") folder = "upload/image";
    else if (type === "video") folder = "upload/video";

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// 3. INITIALIZE UPLOAD (Define this SECOND)
const upload = multer({ storage: storage });

// 4. ROUTES (Use 'upload' only AFTER it is initialized)
// Ensure 'upload' is initialized above this route to avoid ReferenceErrors
app.put('/api/updateuserprofile/:id', upload.single('profilePic'), async (req, res) => {
  const { id } = req.params;
  const { mobile, address } = req.body;

  // req.file will be populated by multer if an image was uploaded
  const profilePic = req.file ? req.file.filename : null;

  // Validation for text fields
  if (!mobile || !address) {
    return res.status(400).json({
      error: 'Mobile number and address are required'
    });
  }

  try {
    let query;
    let params;

    if (profilePic) {
      // Scenario A: User uploaded a new image
      query = `UPDATE users SET mobile = ?, address = ?, profilePic = ? WHERE id = ?`;
      params = [mobile, address, profilePic, id];
    } else {
      // Scenario B: User only updated text (keep existing profilePic)
      query = `UPDATE users SET mobile = ?, address = ? WHERE id = ?`;
      params = [mobile, address, id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profilePic: profilePic // Send back the filename so React can update the UI
    });

  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Database error occurred while updating profile' });
  }
});

//get complaint and police 
app.get("/api/police/complaints/:id", async (req, res) => {
  const policeStationId = req.params.id;

  const complaints = await db.query(
    "SELECT * FROM complaint WHERE policestation_id=?",
    [policeStationId]
  );

  res.json(complaints);
});


/////evidance
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const type = req.body.type; // image | video | audio | document

//     let folder = "upload/document"; // default

//     if (type === "image") folder = "upload/image";
//     else if (type === "video") folder = "upload/video";
//     else if (type === "audio") folder = "upload/audio";

//     // Create folder if not exists
//     if (!fs.existsSync(folder)) {
//       fs.mkdirSync(folder, { recursive: true });
//     }

//     cb(null, folder);
//   },

//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueName + path.extname(file.originalname));
//   },
// });


// user side upload 
// const upload = multer({ storage });
//get city by district 
app.get("/api/getcitybydistrictid", async (req, res) => {
  try {
    const { district_id } = req.query;

    if (!district_id) {
      return res.status(400).json({
        message: "district_id is required",
      });
    }

    const [rows] = await pool.query(
      "SELECT * FROM city_table WHERE district_id = ?",
      [district_id]
    );

    res.status(200).json({
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});



//====================================  complaint / evidance ==================================================================
//evidance complaint id 
app.get("/api/evidence/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM evidence WHERE complaint_id = ?",
      [complaintId]
    );

    res.json(rows);
  } catch (err) {
    console.error("FETCH EVIDENCE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch evidence" });
  }
});



// // complaint fetch  by admin
// complaint fetch admin
app.get("/api/complaints", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id,
        c.complaintDate,
        c.incidentDate,
        c.victimName,
        c.contactNumber,
        c.details,
        c.address,
        c.relation,
        c.action_details,
        c.closed_at,
        c.status,
        c.resubmitted_at,
        c.policestation_id,

        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimetype_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes,

        d.id AS district_id,
        d.district_name AS district_name,
        city.city_name AS city_name

      FROM complaint c
      LEFT JOIN district_table d ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id

      ORDER BY 
        c.resubmitted_at DESC,
        c.id DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error("🔥 SQL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});




////zone fetch

app.get("/api/zones/:districtId", async (req, res) => {
  const { districtId } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM zone_table WHERE district_id = ?",
      [districtId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch zones" });
  }
});


///fetch police through zone
app.get("/api/police-stations/:zoneId", async (req, res) => {
  const { zoneId } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM policestation_name WHERE zone_id = ?",
      [zoneId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching police stations:", err);
    res.status(500).json({ message: "Failed to fetch police stations" });
  }
});


/// Assign complaint

app.post("/api/assign-complaint", async (req, res) => {
  const { complaintId, policeStationId } = req.body;

  try {
    await pool.query(
      `UPDATE complaint
       SET policestation_id = ?, status = 'Assigned'
       WHERE id = ?`,
      [policeStationId, complaintId]
    );

    res.json({ message: "Complaint assigned successfully" });
  } catch (error) {
    console.error("Assignment Error:", error);
    res.status(500).json({ message: "Assignment failed" });
  }
});





//basic complaint 
//============ Complaint =============

app.post("/api/complaint", async (req, res) => {
  try {
    const {
      user_id,
      complaintDate,
      victimName,
      relation,
      contactNumber,
      crimeType,
      incidentDate,
      incidentTime,
      district,
      city,
      address,
      pincode,
      witnessName,
      details,
      latitude,        // ✅ NEW
      longitude        // ✅ NEW
    } = req.body;

    // Validation
    if (
      !user_id ||
      !complaintDate ||
      !victimName ||
      !contactNumber ||
      !crimeType ||
      !Array.isArray(crimeType) ||
      crimeType.length === 0
    ) {
      return res.status(400).json({ message: "Required fields missing!" });
    }

    const sql = `
      INSERT INTO complaint 
      (user_id, complaintDate, victimName, relation, contactNumber, crimeType_id, 
       incidentDate, incidentTime, district_id, city_id, 
       address, pincode, witnessName, details,
       latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const crimeTypeString = JSON.stringify(crimeType);

    const [result] = await pool.query(sql, [
      user_id,
      complaintDate,
      victimName,
      relation || null,
      contactNumber,
      crimeTypeString,
      incidentDate || null,
      incidentTime || null,
      district || null,
      city || null,
      address || null,
      pincode || null,
      witnessName || null,
      details || null,
      latitude || null,     // ✅ NEW
      longitude || null     // ✅ NEW
    ]);

    res.status(201).json({
      message: "Complaint filed successfully ✅",
      id: result.insertId,
    });

  } catch (error) {
    console.error("Complaint Insert Error:", error);
    res.status(500).json({
      message: "Server error ❌",
      error: error.message,
    });
  }
});


//-----------------
//change password
//-------------

app.put("/api/change-password", async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check old password
    const [rows] = await pool.query(
      "SELECT password FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (rows[0].password !== oldPassword) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Update password
    await pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [newPassword, userId]
    );

    res.json();

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//========================================================== dynamic api for admin/police ==================================================================

app.post("/api/adminlogin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user by email
    const sql = "SELECT * FROM credential_table WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    // Plain text password check (for now)
    if (rows[0].password !== password) {
      return res.status(401).json({ message: "Wrong password" });
    }

    console.log("===> LOGIN ROWS:", rows);

    // Send response compatible with frontend
    res.json({
      success: true,
      message: "Login successful",
      user: {
        email: rows[0].email,
        role: rows[0].role,  // ADMIN or POLICE
        role_id: rows[0].role_id
      }
    });

  } catch (err) {
    console.error("LOGIN API ERROR →", err);
    res.status(500).json({ message: "Server error" });
  }
});

// //login police 
app.post("/api/policelogin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const sql = "SELECT * FROM credential_table WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "police not found" });
    }

    // plain text password check (for now)
    if (rows[0].password !== password) {
      return res.status(401).json({ message: "Wrong password" });
    }

    res.json({
      success: true,
      message: "Login successfully",
      police: {
        email: rows[0].email,
        role: rows[0].role,
        role_id: rows[0].role_id
      }
    });

  } catch (err) {
    console.error("LOGIN API ERROR →", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login API admin

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const sql = "SELECT id, password FROM credential_table WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "admin not found" });
    }

    // plain text password check (for now)
    if (rows[0].password !== password) {
      return res.status(401).json({ message: "Wrong password" });
    }
    //userId: rows[0].id 
    res.json({ success: true, message: " admin login successful", adminId: rows[0].id });

  } catch (err) {
    console.error("LOGIN API ERROR →", err);
    res.status(500).json({ message: "Server error" });
  }
});
//======================    admin profile ==============================================

// ✅ GET Admin Profile
app.get("/api/getAdminProfile", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM adminprofile_table LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ✅ UPDATE Profile
// ✅ UPDATE Admin Profile
app.put("/api/updateAdminProfile", async (req, res) => {
  try {
    const {
      fullName,
      officeAddress,
      officialEmail,
      officialContact,
      postingState,
    } = req.body;

    const query = `
      UPDATE adminprofile_table 
      SET 
        fullName = ?, 
        officeAddress = ?, 
        officialEmail = ?, 
        officialContact = ?, 
        postingState = ?
      LIMIT 1
    `;

    await pool.query(query, [
      fullName,
      officeAddress,
      officialEmail,
      officialContact,
      postingState,
    ]);

    res.json({
      success: true,
      message: "Profile updated successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// change password 
// CHANGE PASSWORD ENDPOINT
app.put("/api/changePassword", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const adminEmail = "admin@crime.com"; // current logged-in admin email

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Both fields are required" });
  }

  try {
    // 1️⃣ Get admin current password
    const [rows] = await pool.query(
      "SELECT password FROM credential_table WHERE email = ? AND role = 'ADMIN'",
      [adminEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const currentPassword = rows[0].password;

    // 2️⃣ Check old password
    if (currentPassword !== oldPassword) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // 3️⃣ Update password
    await pool.query(
      "UPDATE  credential_table SET password = ? WHERE email = ? AND role = 'ADMIN'",
      [newPassword, adminEmail]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});




// CHANGE police PASSWORD ENDPOINT
app.put("/api/policechangePassword", async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const policeEmail = "townpolice@crime.com"; // ⚠️ temporary hardcoded

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both fields are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT password FROM credential_table WHERE email = ? AND role = 'POLICE'",
      [policeEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Police not found" });
    }

    const passwordFromDB = rows[0].password;

    // Compare old password
    if (passwordFromDB !== currentPassword) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Update new password
    await pool.query(
      "UPDATE credential_table SET password = ? WHERE email = ? AND role = 'POLICE'",
      [newPassword, policeEmail]
    );

    res.json({ message: "Password changed successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



//======================================================================================


//==========================================   not approved=======================================================================================================


//update complaint by police 
app.post("/api/update-complaint-status", async (req, res) => {
  const { complaintId, status, rejectionReason } = req.body;

  console.log("Incoming Body:", req.body);

  if (!complaintId || !status) {
    return res.status(400).json({
      error: "complaintId and status are required",
    });
  }

  const newStatus = status.toLowerCase();

  const allowedStatus = ["approved", "rejected"];

  if (!allowedStatus.includes(newStatus)) {
    return res.status(400).json({
      error: "Invalid status. Use approved or rejected",
    });
  }

  if (newStatus === "rejected" && !rejectionReason?.trim()) {
    return res.status(400).json({
      error: "Rejection reason is required",
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE complaint 
       SET status = ?, 
           rejectionReason = ?, 
           updated_at = NOW()
       WHERE id = ?`,
      [
        newStatus,
        newStatus === "rejected" ? rejectionReason.trim() : null,
        complaintId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Complaint not found",
      });
    }

    res.json({
      success: true,
      message: `Complaint ${newStatus} successfully`,
    });

  } catch (err) {
    console.error("Update complaint status error:", err);
    res.status(500).json({
      error: "Database error",
    });
  }
});


///status

///status

app.get("/api/complaints/status/:id", async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    "SELECT status, rejectionReason FROM complaint WHERE id = ?",
    [id]
  );

  res.json(rows[0]);
});

////evidence view through user

app.get("/api/evidence/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT e.*
      FROM evidence e
      JOIN complaint c ON e.complaint_id = c.id
      WHERE c.user_id = ?
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("User Evidence Fetch Error:", err);
    res.status(500).json({ message: "Failed to fetch evidence" });
  }
});

///  Complaint View paricular User

///  Complaint View paricular User
///  Complaint View paricular User
app.get("/api/complaints/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        c.*,
        d.district_name,
        city.city_name,

       c.policestation_id,
        ps.name AS policestation_name,

        ps.address As policestation_address,
        ps.mobileno As contact,

        -- ✅ MULTIPLE CRIME TYPES
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
              c.crimeType_id,
              JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c
      LEFT JOIN district_table d ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
        LEFT JOIN policestation_name ps ON ps.id = c.policestation_id

      WHERE c.user_id = ?
      ORDER BY c.id DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("SQL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ User Complaint List API
app.get("/api/complaints/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  const [rows] = await pool.query(
    "SELECT * FROM complaint WHERE user_id=?",
    [userId]
  );

  res.json(rows);
});

// ✅ Complaint Status Tracking API
app.get("/api/complaint/checkstatus/:id", async (req, res) => {
  const complaintId = req.params.id;
  const userId = req.query.userId;

  const [rows] = await pool.query(
    "SELECT * FROM complaint WHERE id=? AND user_id=?",
    [complaintId, userId]
  );

  if (rows.length === 0) {
    return res.status(403).json({
      message: "Unauthorized Access",
    });
  }

  res.json(rows[0]);
});



// ---------- UPLOAD API  user  ----------
app.post("/api/upload", upload.array("files", 10), async (req, res) => {
  try {
    const { type, description, complaint_id } = req.body;

    // ✅ 1. Insert Evidence
    const values = req.files.map(file => [
      complaint_id,
      type,
      description,
      file.filename,
      file.path.replace(/\\/g, "/")
    ]);

    const sql = `
      INSERT INTO evidence 
      (complaint_id, type, description, file_name, file_path)
      VALUES ?
    `;

    await pool.query(sql, [values]);

    // ===============================
    // 🔥 2. UPDATE USER NOTIFICATION (YAHI NAYA CODE)
    // ===============================
    await pool.query(
      `UPDATE notification_table 
       SET is_completed = 1 
       WHERE complaint_id = ? 
       AND user_id IS NOT NULL`,
      [complaint_id]
    );

    // ===============================
    // 🔔 3. EXISTING POLICE NOTIFICATION
    // ===============================

    const [complaintRows] = await pool.query(
      "SELECT policestation_id FROM complaint WHERE id = ?",
      [complaint_id]
    );

    const policeId = complaintRows[0]?.policestation_id;

    if (policeId) {
     // 🔔 3. POLICE NOTIFICATION (FIXED)
const [complaintRows] = await pool.query(
  "SELECT policestation_id FROM complaint WHERE id = ?",
  [complaint_id]
);

const policeId = complaintRows[0]?.policestation_id;

if (policeId) {
  await pool.query(
    `INSERT INTO notification_table 
    (complaint_id, police_id, message, sender_role, title, is_read) 
    VALUES (?, ?, ?, ?, ?, 0)`,
    [
      complaint_id,
      policeId,
      `${req.files.length} new evidence file(s) uploaded`,
      "user",
      "New Evidence Uploaded"
    ]
  );
}
    }

    res.json({ success: true });

  } catch (err) {
    console.error("UPLOAD FULL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

//notification for police 
app.get("/api/notifications/police/:id", async (req, res) => {
  try {
    const policeId = req.params.id;

    const [rows] = await pool.query(
      `SELECT * FROM notification_table WHERE police_id = ?`,
      [policeId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});


app.post("/api/add-investigation-update", upload.array("files"), async (req, res) => {
  try {
    const { complaintId, description } = req.body;
    let evidenceType = req.body.evidenceType || null;

    if (!description || description.trim() === "") {
      return res.status(400).json({ message: "Description is required" });
    }

    // CASE 1: If files exist
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        await pool.query(
          `INSERT INTO investigation_updates
           (complaint_id, description, type, file_name, file_path)
           VALUES (?, ?, ?, ?, ?)`,
          [
            complaintId,
            description,
            evidenceType,
            f.filename,
            f.path.replace(/\\/g, "/"),
          ]
        );
      }
    }
    // CASE 2: Only description (NO files)
    else {
      await pool.query(
        `INSERT INTO investigation_updates
         (complaint_id, description, type, file_name, file_path)
         VALUES (?, ?, ?, ?, ?)`,
        [complaintId, description, null, null, null]
      );
    }

    // Update complaint status
    await pool.query(
      `UPDATE complaint SET status = 'under_investigation' WHERE id = ?`,
      [complaintId]
    );

    res.json({ message: "Investigation updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// Get single complaint by ID
app.get("/api/complaint/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        c.*,
        d.district_name,
        city.city_name,
      
       c.policestation_id,
        ps.name AS policestation_name,

        ps.address As policestation_address,
        ps.mobileno As contact,

        -- ✅ MULTIPLE CRIME TYPES
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
              c.crimeType_id,
              JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c
      LEFT JOIN district_table d ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
        LEFT JOIN policestation_name ps ON ps.id = c.policestation_id
      WHERE c.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


//  complaint closed by admin 
app.post("/api/admin/close-case", async (req, res) => {
  const { complaintId } = req.body;

  try {
    await pool.query(
      "UPDATE complaint SET status = 'closed' WHERE id = ?",
      [complaintId]
    );

    res.json({ message: "Complaint closed successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});




//  get complaint by admin- investigation 

app.get("/api/complaintsappreje", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.*,

        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimetype_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes,

        d.district_name AS district_name,
        ci.city_name AS city_name

      FROM complaint c

      LEFT JOIN policestation_name ps 
      ON ps.id = c.policestation_id

      LEFT JOIN district_table d 
      ON d.id = c.district_id

      LEFT JOIN city_table ci 
      ON ci.id = c.city_id

      WHERE c.status IN ('approved','under_Investigation','reopen','closed')

      ORDER BY c.id DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error("🔥 SQL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});











//multi file upload 
app.post("/api/add-reopen-evidence", upload.array("files", 10), async (req, res) => {
  try {
    const { complaintId, description } = req.body;
    const files = req.files;

    if (!complaintId || !description || files.length === 0) {
      return res.status(400).json({
        message: "Complaint ID, description and files are required"
      });
    }

    // Insert each file
    for (let file of files) {
      const sql = `
        INSERT INTO reopen_evidence 
        (complaint_id, description, file, created_at)
        VALUES (?, ?, ?, NOW())
      `;

      await pool.query(sql, [
        complaintId,
        description,
        file.filename
      ]);
    }

    res.status(200).json({
      message: "Reopen evidence uploaded successfully"
    });

  } catch (error) {
    console.error("Multi upload error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
});



//complaint closed 
app.put("/api/update-status/:id", async (req, res) => {

  
  const { status, actionDetails } = req.body;
  const { id } = req.params;

  try {
    await pool.query(
      `
      UPDATE complaint 
      SET 
        status = ?, 
        action_details = ?, 
        closed_at = NOW()
      WHERE id = ?
      `,
      [status, actionDetails, id]
    );

    res.json({
      success: true,
      message: "Status and action details updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
});
// re reminder 
// re reminder 
app.put("/api/complaints/resubmit/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Corrected: Use SELECT to get details first
    const [rows] = await pool.query(
      `SELECT status, resubmitted_at, complaintDate FROM complaint WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const complaint = rows[0];

    // 2️⃣ Prevent resubmit if already assigned to an officer
    if (complaint.status?.toLowerCase() === "assigned") {
      return res.status(400).json({
        message: "Assigned complaints cannot be resubmitted",
      });
    }

    // 3️⃣ 24-hour check (Compare against the original complaintDate)
    const complaintDate = new Date(complaint.complaintDate);
    const now = new Date();
    const diffHours = (now - complaintDate) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return res.status(400).json({
        message: "You can resubmit only after 24 hours of the original filing",
      });
    }

    // 4️⃣ Update resubmitted_at ONLY (Do not touch complaintDate)
    await pool.query(
      `UPDATE complaint 
       SET 
         resubmitted_at = NOW(),
         status = 'Pending'
       WHERE id = ?`,
      [id]
    );

    res.json({ message: "Complaint resubmitted successfully" });

  } catch (error) {
    console.error("RESUBMIT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// routes/admin.js  (ya jaha tum routes likhti ho)
app.post("/api/admin/reopen-case", async (req, res) => {
  try {
    const { complaintId, reopen_reason } = req.body;

    if (!complaintId || !reopen_reason) {
      return res.status(400).json({
        message: "Complaint ID and reopen reason are required",
      });
    }

    const sql = `
      UPDATE complaint
      SET 
        status = 'reopen',
        reopen_reason = ?
      WHERE id = ?
    `;

    await pool.query(sql, [reopen_reason, complaintId]);

    res.status(200).json({
      message: "Case reopened successfully",
    });

  } catch (error) {
    console.error("Reopen error:", error);
    res.status(500).json({
      message: "Server error while reopening case",
    });
  }
});
// routes/admin.js  (ya jaha tum routes likhti ho)

app.post("/api/admin/reopen-case", async (req, res) => {
  try {
    const { complaintId, reopen_reason } = req.body;

    if (!complaintId || !reopen_reason) {
      return res.status(400).json({
        message: "Complaint ID and reopen reason are required",
      });
    }

    const sql = `
      UPDATE complaint
      SET 
        status = 'reopen',
        reopen_reason = ?,
        reopened_time = NOW()
      WHERE id = ?
    `;

    await pool.query(sql, [reopen_reason, complaintId]);

    res.status(200).json({
      message: "Case reopened successfully",
    });

  } catch (error) {
    console.error("Reopen error:", error);
    res.status(500).json({
      message: "Server error while reopening case",
    });
  }
});


//closed by admin 
// POST /admin/close-case
app.post("/api/admin/close-case", async (req, res) => {
  try {
    const { complaintId } = req.body;

    if (!complaintId) {
      return res.status(400).json({ message: "Complaint ID is required" });
    }

    // Update complaint status to "closed"
    const query = "UPDATE complaint SET status = 'closed' WHERE id = ?";
    const [result] = await pool.execute(query, [complaintId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    return res.json({ message: "Case closed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});



//==============Investigation============

app.get("/api/investigation/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM investigation_updates WHERE complaint_id = ?",
      [complaintId]
    );

    res.json({
      investigation: rows,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});




//any query 
//
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, contact, message } = req.body;

    // Validate fields
    if (!name || !email || !contact || !message) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    // Check if email exists in users table
    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Email not registered. Please use your registered email.",
      });
    }

    // Insert message (ONLY 4 fields)
    const sql = `
      INSERT INTO contacts
      (name, email, contact, message)
      VALUES (?, ?, ?, ?)
    `;

    await pool.query(sql, [
      name,
      email,
      contact,
      message,
    ]);

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "unntikanurkar@gmail.com",
      subject: "New Contact Query - eCrime Portal",
      html: `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Contact:</b> ${contact}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "Message sent successfully",
    });

  } catch (err) {
    console.error("CONTACT API ERROR:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});



app.post("/api/send-notification", async (req, res) => {
  try {
    let { user_id, complaint_id, title, message, sender_role } = req.body;

    let complaintDetails = null;

    // ✅ Complaint logic (same)
    if (complaint_id) {
      const [rows] = await pool.query(
        "SELECT * FROM complaint WHERE id = ?",
        [complaint_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      user_id = rows[0].user_id;
      complaintDetails = rows[0];
    }

    // ✅ 🔥 ALL USERS CASE
    if (user_id === "all") {
      const [allUsers] = await pool.query("SELECT id FROM users");

      for (let u of allUsers) {
        await pool.query(
          `INSERT INTO notification_table 
          (user_id, complaint_id, title, message, sender_role) 
          VALUES (?, ?, ?, ?, ?)`,
          [u.id, null, title, message, sender_role]
        );
      }

      return res.json({
        success: true,
        message: "Notification sent to ALL users",
      });
    }

    // ✅ NORMAL CASE (single user)
    await pool.query(
      `INSERT INTO notification_table 
      (user_id, complaint_id, title, message, sender_role) 
      VALUES (?, ?, ?, ?, ?)`,
      [user_id, complaint_id, title, message, sender_role]
    );

    res.json({
      success: true,
      message: "Notification sent",
      complaint: complaintDetails,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});
//2 attempt save token 
app.post("/api/save-token", async (req, res) => {
  try {
    const { user_id, token } = req.body;

    // ✅ yeh add karo
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required"
      });
    }

    const query = `
      INSERT INTO token_table (user_id, token, created_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE token = VALUES(token)
    `;

    await pool.query(query, [user_id, token]);

    res.json({
      success: true,
      message: "Token saved / updated"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});
//3 attampt  save token 
app.post("/save-token", async (req, res) => {
  try {
    const { userId, role, token } = req.body;

    let user_id = null;
    let police_id = null;

    if (role === "POLICE") {
      police_id = userId;
    } else {
      user_id = userId; // ADMIN + USER
    }

    // duplicate remove
    await pool.query(
      "DELETE FROM fcm_tokens WHERE token = ?",
      [token]
    );

    await pool.query(
      `INSERT INTO fcm_tokens (user_id, police_id, token, created_at)
       VALUES (?, ?, ?, NOW())`,
      [user_id, police_id, token]
    );

    res.json({ success: true });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/userprofiless", async (req, res) => {

  try {

    const query = `SELECT 
    name, email, mobile, address, gender, birthdate, d.district_name,  city.city_name,aadhaar_front, aadhaar_back FROM users
    LEFT JOIN district_table d ON d.id = users.district_id
LEFT JOIN city_table city ON city.id = users.city_id;
    `;


    const [rows] = await pool.query(query);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

//userdetailfetch in notification
app.get("/api/usersdetails", async (req, res) => {

  try {

    const query = "SELECT id,email FROM users";

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});
//notification policedetails
app.get("/api/policedetails", async (req, res) => {

  try {

    const query = "SELECT id, email FROM policestation_name ";

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


//token remove 
app.post("/api/remove-token", (req, res) => {

  const { userId } = req.body;

  pool.query(
    "DELETE FROM token_table WHERE user_id=?",
    [userId],
    (err, result) => {
      if (err) {
        res.status(500).json(err);
      } else {
        res.json({ message: "Token removed successfully" });
      }
    });

});


//read notification 
app.post("/api/read-notifications", async (req, res) => {

  const { userId } = req.body;
  try {

    const [result] = await pool.query(
      "UPDATE notification_table SET is_read = ? WHERE user_id = ?",
      [1, userId]
    );

    res.json({ success: true, result });

  } catch (error) {

    console.log(error);
    res.status(500).json({ error: "Database error" });

  }

});

//FETCH ADMIN IN POLICEDASHBOARD 
app.get("/api/admindetails", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email FROM credential_table WHERE LOWER(role) = 'admin'"
    );

    res.json({ data: result.rows });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

//notification policedetails
app.get("/api/adminsdetails", async (req, res) => {

  try {

    const query = "SELECT id, email FROM credential_table WHERE role = 'ADMIN'";

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {



    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

//============================= reports=========================
app.get("/api/time", async (req, res) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      district,
      city,
      status,
      policestation_id
    } = req.query;

    let sql = `
      SELECT 
        c.id,
        c.victimName,
        c.created_at,
        c.status,
        d.district_name,
        city.city_name,
        ps.name AS policestation_name,
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes
      FROM complaint c
      LEFT JOIN district_table d ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id
      WHERE 1=1
    `;

    const values = [];

    /* ---------- DATE HANDLING (Strictly Selected Date) ---------- */

    if (reportType === "daily" && startDate) {
      sql += ` AND DATE(c.created_at) = ?`;
      values.push(startDate);
    }
    // If Weekly is selected, filter between the start and end of that specific week
    else if (reportType === "weekly" && startDate && endDate) {
      sql += ` AND DATE(c.created_at) BETWEEN ? AND ?`;
      values.push(startDate, endDate);
    }

    /* ---------- POLICE STATION FILTER ---------- */
    if (reportType === "police") {
      sql += ` AND c.policestation_id IS NOT NULL`;
      if (policestation_id && policestation_id !== "all") {
        sql += ` AND c.policestation_id = ?`;
        values.push(policestation_id);
      }
    }

    /* ---------- LOCATION FILTERS ---------- */
    if (district) {
      sql += ` AND d.district_name = ?`;
      values.push(district);
    }

    if (city) {
      sql += ` AND city.city_name = ?`;
      values.push(city);
    }

    /* ---------- STATUS FILTER ---------- */
    if (status) {
      sql += ` AND c.status = ?`;
      values.push(status);
    }

    // Default Sorting: Newest first
    sql += ` ORDER BY c.created_at DESC`;

    const [rows] = await pool.query(sql, values);

    // Return empty array if no data found for that specific date
    res.json(rows);

  } catch (err) {
    console.error("TIME REPORT API ERROR:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//==========Reports==================

app.get("/api/reports", async (req, res) => {
  try {
    const status = req.query.status; // optional
    let sql = `
      SELECT
        c.*,
        d.district_name,
        city.city_name,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(c.crimeType_id, JSON_QUOTE(CAST(ct.id AS CHAR)))
        ) AS crimetypes
      FROM complaint c
      LEFT JOIN district_table d ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id
    `;
    if (status) {
      sql += " WHERE c.status = ?";
      const [rows] = await pool.query(sql, [status]);
      res.json(rows);
    } else {
      const [rows] = await pool.query(sql);
      res.json(rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});




app.get("/api/policestation/:email", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ps.*, d.district_name 
       FROM policestation_name ps
       LEFT JOIN district_table d ON ps.district_id = d.id
       WHERE ps.email = ?`,
      [req.params.email]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Police station not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching police station:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/api/getcomplaints/:role_id", async (req, res) => {
  try {
    const { role_id } = req.params; // ✅ correct

    if (!role_id) {
      return res.status(400).json({ error: "Police station ID required" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        c.id,
        c.complaintDate,
        c.incidentDate,
        c.victimName,
        c.details,
        c.address,
        c.status,
        c.rejectionReason,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- ✅ MULTIPLE CRIME TYPES
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c
      LEFT JOIN district_table d ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id

      WHERE c.policestation_id = ?
      ORDER BY c.id DESC
      `,
      [role_id] // ✅ correct binding
    );

    res.json(rows);
  } catch (error) {
    console.error("SQL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});


//+=========================================================================================================



// //=========================

//get approved complaint
app.get("/api/investigation-list/:role_id", async (req, res) => {
  const { stationId } = req.params;

  const [rows] = await pool.query(
    `SELECT * FROM complaint
     WHERE policestation_id = ?
     AND status IN ('approved','under_Investigation','reopen','closed')`,

    [role_id]
  );

  res.json(rows);
});
//===========get approved complaint============

app.get("/api/investigation-list/:stationId", async (req, res) => {
  const { stationId } = req.params;

  const [rows] = await pool.query(
    `SELECT * FROM complaint
     WHERE policestation_id = ?
     AND status = 'approved'`,

    [stationId]
  );

  res.json(rows);
});



//===========================Reports========================
//====Total complaints====================
app.get("/api/reports/total-complaints", async (req, res) => {
  try {

    const sql = `
      SELECT 
        c.*,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- Multiple Crime Types
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c

      LEFT JOIN district_table d  ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id
    `;

    const [rows] = await pool.query(sql);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


//========Pending complaints==============
app.get("/api/reports/pending", async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- Multiple Crime Types
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c

      LEFT JOIN district_table d  ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id
      WHERE c.status = 'Pending'
    `;

    const [rows] = await pool.query(sql);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


//========Assigned complaints==============
app.get("/api/reports/assigned", async (req, res) => {
  try {

    const sql = `
      SELECT 
        c.*,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- Multiple Crime Types
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c

      LEFT JOIN district_table d  ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id
      WHERE c.status = 'Assigned'
    `;

    const [rows] = await pool.query(sql);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


//========Approved complaints==============
app.get("/api/reports/approved", async (req, res) => {
  try {

    const sql = `
      SELECT 
        c.*,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- Multiple Crime Types
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c

     
      LEFT JOIN district_table d  ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id
      WHERE c.status = 'Approved'
    `;

    const [rows] = await pool.query(sql);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


//========Under Investigation==============
app.get("/api/reports/under_investigation", async (req, res) => {
  try {

    const sql = `
      SELECT 
        c.*,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- Multiple Crime Types
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c

      LEFT JOIN district_table d  ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id
      WHERE c.status = 'under_investigation'
    `;

    const [rows] = await pool.query(sql);
    res.json(rows);

  } catch (error) {
    console.error("Investigation error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});


//========Closed complaints==============
app.get("/api/reports/closed", async (req, res) => {
  try {

    const sql = `
      SELECT 
        c.*,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- Multiple Crime Types
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c

     
      LEFT JOIN district_table d  ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id

      WHERE c.status = 'Closed'
    `;

    const [rows] = await pool.query(sql);

    res.json(rows);

  } catch (error) {
    console.error("Closed Report Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// user notification
app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const sql = `
      SELECT 
        n.*,
        c.id AS complaint_id,
        c.details,
        c.status,
        c.victimName
      FROM notification_table n
      LEFT JOIN complaint c ON c.id = n.complaint_id
      WHERE n.user_id = ?
      ORDER BY n.id DESC
    `;

    const [rows] = await pool.query(sql, [userId]);

    res.json(rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});


// GET notification (modify if needed)
app.get("/", async (req, res) => {

  const id = req.params.id;

  const [rows] = await pool.query(
    "SELECT * FROM notification_table WHERE user_id=? OR police_id=? ORDER BY created_at DESC",
    [id, id]
  );

  res.json(rows);
});

//read by police side 
app.post("/api/read-notifications", async (req, res) => {

  const { policeId } = req.body;

  await pool.query(
    "UPDATE notification_table SET is_read=1 WHERE police_id=?",
    [policeId]
  );

  res.json({ success: true });

});



app.get("/api/police-complaints/:policeId", async (req, res) => {
  try {

    const { policeId } = req.params;

    const sql = `
      SELECT 
        c.*,

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- Multiple Crime Types
        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            c.crimeType_id,
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c

      LEFT JOIN district_table d  ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps ON ps.id = c.policestation_id

      WHERE c.policestation_id = ?
      ORDER BY c.id DESC
    `;

    const [rows] = await pool.query(sql, [policeId]);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error("Police Complaints Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});



app.get("/api/getcomplaints/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ error: "Police station ID required" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        c.id,
        c.complaintDate,
        c.incidentDate,
        c.victimName,
        c.details,
        c.relation,
        c.witnessName,
        c.contactNumber,
      
        c.closed_at,
        c.status,
        c.pincode,
       

        d.district_name,
        city.city_name,

        c.policestation_id,
        ps.name AS policestation_name,
        ps.address AS policestation_address,
        ps.mobileno AS contact,

        -- ✅ YEH ADD KIYA (IMPORTANT)
        (
          SELECT iu.action_details 
          FROM investigation_updates iu
          WHERE iu.complaint_id = c.id
          ORDER BY iu.created_at DESC
          LIMIT 1
        ) AS action_details,

        (
          SELECT GROUP_CONCAT(ct.typename SEPARATOR ', ')
          FROM crimetype_table ct
          WHERE JSON_CONTAINS(
            IFNULL(c.crimeType_id, '[]'),
            JSON_QUOTE(CAST(ct.id AS CHAR))
          )
        ) AS crimetypes

      FROM complaint c
      LEFT JOIN district_table d ON d.id = c.district_id
      LEFT JOIN city_table city ON city.id = c.city_id
      LEFT JOIN policestation_name ps 
        ON ps.id = c.policestation_id

      WHERE c.policestation_id = ?
      AND LOWER(c.status) = 'closed'

      ORDER BY c.id DESC
      `,
      [id]
    );

    res.json(rows);

  } catch (error) {
    console.error("SQL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});


//////////////////////////////////      couter police notification ////////////////////////////////////

// ===== Police Unread Notification Count =====
// 🔔 UNREAD COUNT (POLICE)
app.get("/api/notifications/police/unread/:id", async (req, res) => {
  try {
    const policeId = req.params.id;

    const sql = `
      SELECT COUNT(*) AS count 
      FROM notification_table 
      WHERE police_id = ? 
      AND is_read = 0
    `;

    const [rows] = await pool.query(sql, [policeId]);

    res.json({ count: rows[0].count });

  } catch (error) {
    console.error("Unread Count Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ===== Mark Notifications as Read =====
// 🔔 MARK AS READ (POLICE)
app.put("/api/notifications/mark-read/:id", async (req, res) => {
  try {
    const policeId = req.params.id;

    const sql = `
      UPDATE notification_table 
      SET is_read = 1 
      WHERE police_id = ?
    `;

    await pool.query(sql, [policeId]);

    res.json({ message: "Marked as read" });

  } catch (error) {
    console.error("Mark Read Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

//==========================================================================================================================================



// Start Server
// Binds server to port → starts listening for requests
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

///   Unnati   server 