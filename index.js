const express = require('express');
const app = express();
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const twilio = require('twilio');
let jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const session = require('express-session');
const { checkToken } = require('./auth/token_validation');
const cors=require('cors')
const nodemailer = require('nodemailer');
const fs = require('fs');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root12",
  database: "medshyne"
});

app.use(bodyParser.json());

app.use(express.static('build'));

app.get('/', (req, res) => {
  // res.sendFile(__dirname + '/build/index.html');
});

function convertPdfToBase64(pdfFilePath, dataType = 'pdf') {
  if (dataType !== 'pdf') {
    throw new Error('Unsupported data type. This function only supports "pdf" data type.');
  }
  const fileData = fs.readFileSync(pdfFilePath);
  return fileData.toString('base64');
}
 
// Function to convert image to base64
const convertImageToBase64 = (filename, imageType = 'png' ) => {
  try{
    const buffer = fs.readFileSync(filename);
    const base64String = Buffer.from(buffer).toString('base64');
    return `data:image/${imageType};base64,${base64String}`;
  } catch (error) {
    throw new Error ("file ${filename} no exist")
  }
}
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: '605001',
  resave: false,
  saveUninitialized: false
}));

//--------------------------------------------------------- velu code  --------
function validateCreateUserInput(req, res, next) {
  const {
    organization_name,
    organization_type,
    email_id,
    organization_mobile_no,
    address,
    state,
    pincode,
    gst_number,
    count_of_student,
    count_of_staff,
    organisation_register_no,
    referral_username,
    how_hear_us,
    contact_name,
    designation,
    contact_email_id,
    contact_mobile_no,
    username,
    password,
    updated_by
  } = req.body;

  // Validation rules
  const validationRules = {
    organization_name: { required: true, type: 'string' },
    organization_type: { required: true, type: 'string' },
    email_id: { required: true, type: 'email' },
    organization_mobile_no: { required: true, type: 'string', pattern: /^\d{10}$/ },
    address: { required: true, type: 'string' },
    state: { required: true, type: 'string' },
    pincode: { required: true, type: 'string', pattern: /^\d{6}$/ },
    gst_number: { required: true, type: 'string' },
    count_of_student: { required: true, type: 'number' },
    count_of_staff: { required: true, type: 'number' },
    organisation_register_no: { required: true, type: 'string' },
    referral_username: { required: true, type: 'string' },
    how_hear_us: { required: true, type: 'string' },
    contact_name: { required: true, type: 'string' },
    designation: { required: true, type: 'string' },
    contact_email_id: { required: true, type: 'email' },
    contact_mobile_no: { required: true, type: 'string', pattern: /^\d{10}$/ },
    username: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
   
  };
  

  // Validate each field
  const errors = [];
  for (const field in validationRules) {
    const rule = validationRules[field];
    if (rule.required && !req.body[field]) {
      errors.push(`${field} is required.`);
    }
    if (req.body[field] && rule.type === 'email' && !isValidEmail(req.body[field])) {
      errors.push(`${field} should be a valid email.`);
    }
    if (req.body[field] && rule.pattern && !rule.pattern.test(req.body[field])) {
      errors.push(`${field} format is invalid.`);
    }
  }  

  // If there are errors, return a response with the error messages
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // If validation passes, proceed to the next middleware or route handler
  next();
}

// Example function to check if a string is a valid email address
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

app.post('/createuser', async (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {organization_name, organization_type, email_id, organization_mobile_no, address, state, pincode, gst_number, count_of_student, count_of_staff, organisation_register_no, referral_username, how_hear_us, contact_name, designation, contact_email_id, contact_mobile_no, username, password, updated_by, } = req.body;

    const upload_document_base64 = convertImageToBase64(req.body.upload_documents);
    console.log(upload_document_base64);

    const isWhitespace = /\s/.test(username);
    if (isWhitespace) {
      return res.status(400).json({ Result: "Failure", message: "Username should not contain whitespace." });
    }

    // Check if the username already exists in the database
    // const existingUser = await checkUsernameExists(username);
    // if (existingUser) {
    //   return res.status(400).json({ Result: "Failure", message: "Username already exists." });
    // }
    
    // Hash the password
    // const hashedPwd = await bcrypt.hash(password, 10);

    // Get a connection from the pool
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `INSERT INTO tbluser ( organization_name, organization_type, email_id, organization_mobile_no, address, state, pincode, gst_number, count_of_student, count_of_staff, organisation_register_no, referral_username, how_hear_us, contact_name, designation, contact_email_id, contact_mobile_no, username, password, doc, updated_by, updated_at,upload_documents) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, CURRENT_TIMESTAMP(),?)`;
      con.query(sql, [ organization_name, organization_type, email_id, organization_mobile_no, address, state, pincode, gst_number, count_of_student, count_of_staff, organisation_register_no, referral_username, how_hear_us, contact_name, designation, contact_email_id, contact_mobile_no, username, password, updated_by,upload_document_base64], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
      });
    });    
   
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

app.get('/viewbyid',async (req, res)=>{
  res.header('Content-Type', 'application/json');
  try {
    const {id}  = req.body;
    // Get a connection from the pool
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tbluser WHERE id =?`;
        con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });

  } catch   (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

app.get('/viewall',async (req, res)=>{

  res.header('Content-Type', 'application/json');
  try {
    // Get a connection from the pool
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tbluser`;
        con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  }catch   (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
  });


  app.put('/updateuser',  (req, res)=> {
    res.header('Content-Type', 'application/json');
    try {
      const {organization_name, organization_type, email_id, organization_mobile_no, address, state, pincode, gst_number, count_of_student, count_of_staff, organisation_register_no, referral_username, how_hear_us, contact_name, designation, contact_email_id, contact_mobile_no, username, password,id} = req.body;
      // Hash the password
      // const salt = bcrypt.genSaltSync(10);
      // const hashedPwd = bcrypt.hashSync(password, salt);

        //   bcrypt.hash(password, 10, (err, hashedPwd) => {
        // if (err) {
        //     console.error('Error hashing password:', err);
        //     return res.status(500).json({ error: 'Internal server error' });
        //   }
        // });           
            con.connect(function(err) {
              if (err)  throw err;
              console.log("Connected!");
              var sql = `UPDATE tbluser set organization_name=?, organization_type=?, email_id=?, organization_mobile_no=?, address=?, state=?, pincode=?, gst_number=?, count_of_student=?, count_of_staff=?, organisation_register_no=?, referral_username=?, how_hear_us=?, contact_name=?, designation=?, contact_email_id=?, contact_mobile_no=?, username=?, password=? where id=?`;
              con.query(sql, [organization_name, organization_type, email_id, organization_mobile_no, address, state, pincode, gst_number, count_of_student, count_of_staff, organisation_register_no, referral_username, how_hear_us, contact_name, designation, contact_email_id, contact_mobile_no, username, password, id], function(err, result){
                if (err) throw err;
                console.log("record updated successfully");
                res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
              });
            });
            } catch   (ex) {
              console.error('Error:', ex);
              res.status(500).json({ Result: "Failure", message: ex.message });
            }
                
  });


  // app.put('/forget_password', (req, res)=> {
  //   res.header('Content-Type', 'application/json');
  //   try {
  //     const {username, password } = req.body;
  //     console.log(username, password);
  //     // Hash the password
  //     const salt = bcrypt.genSaltSync(10);
  //     const hashedPwd = bcrypt.hashSync(password, salt);

  //         bcrypt.hash(password, 10, (err, hashedPwd) => {
  //       if (err) {
  //           console.error('Error hashing password:', err);
  //           return res.status(500).json({ error: 'Internal server error' });
  //         }
  //       });

  //           // Get a connection from the pool
  //           con.connect(function(err) {
  //             if (err)  throw err;
  //             console.log("Connected!");
  //             var sql = `UPDATE tbluser set  password=? where username=?`;
  //             con.query(sql, [ username, hashedPwd,], function(err, result){
  //               if (err) throw err;
  //               console.log("record updated successfully");
  //               res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
  //             });
  //           });
  //           } catch   (ex) {
  //             console.error('Error:', ex);
  //             res.status(500).json({ Result: "Failure", message: ex.message });
  //           }
                
  // });

  app.delete('/deleteuser', (req, res)=> {
    res.header('Content-Type', 'application/json');
    try {
      const {id}  = req.body;
      // Get a connection from the pool
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `DELETE FROM tbluser WHERE id =?`;
          con.query(sql, [id], function (err, result) {
          if (err) throw err;
          console.log("1 record deleted");
          res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }
  });

  app.post('/loginusername', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
        const { username, password } = req.body;
        // Get a connection from the pool
        con.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");
            var sql = `SELECT * FROM tbluser WHERE username = ?`;
            con.query(sql, [username], function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    if (result[0].password === password) {
                        console.log("Login successful");
                        const token = jwt.sign({ userId: result[0].id, username: result[0].username, organization_name: result[0].organization_name }, '605001', { expiresIn: '1h' });

                        // Include user ID in the response
                        res.status(200).json({ userId: result[0].id, username: result[0].username,organization_name: result[0].organization_name, token, Result: "Success", message: "Login successful" });
                    } else {
                        console.log("Login failed: Incorrect password");
                        res.status(401).json({ Result: "Failure", message: "Login failed: Incorrect password" });
                    }
                } else {
                    console.log("Login failed: User not found");
                    res.status(401).json({ Result: "Failure", message: "Login failed: User not found" });
                }
            });
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
    }

});


app.post('/demo_inserting_orgname', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
      const { name, id_number, token } = req.body;

      // Decode the JWT token to extract the organization_name
      const decodedToken = jwt.verify(token, '605001');
      const organization_name = decodedToken.organization_name; // Corrected typo: organization_name

      con.connect(function (err) {
          if (err) throw err;
          console.log("Connected!");
          var sql = `INSERT INTO tblstudent ( name, id_number, organization_name) VALUES (?, ?, ?)`; // Corrected table name: tblstudent
          con.query(sql, [ name, id_number, organization_name,],
              function (err, result) {
                  if (err) throw err;
                  console.log("1 record inserted");
                  res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
              });
      });

  } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
  }
});



//   app.post('/loginusername', (req, res) => {
//     res.header('Content-Type', 'application/json');
//     try {
//       const {username, password} = req.body;
//       // Get a connection from the pool
//       con.connect(function(err) {
//         if (err) throw err;
//         console.log("Connected!");
//         var sql = `SELECT * FROM tbluser WHERE username =?`;
//           con.query(sql, [username,], function (err, result) {
//             if (err) {
//               console.error('Error checking user credentials:', err);
//               return res.status(500).json({ error: 'Internal server error' });
//           }
//           if (result.length === 0) {
//               return res.status(401).json({ error: 'Invalid credentials' });
//           }
//           const tbluser = result[0];
//           // Compare the provided password with the hashed password from the database
//           compare(password === tbluser.password, (err, match) => {
//               if (err) {
//                   console.error('Error comparing passwords:', err);
//                   return res.status(500).json({ error: 'Internal server error' });
//               }
//               if (!match) {
//                   return res.status(401).json({ error: 'Invalid credentials' });
//               }
//               // Create a JWT token for authentication
//               const token = jwt.sign({ userId: tbluser.id, username: tbluser.username }, '605001', { expiresIn: '1h' });

//               // Include user ID in the response
//               res.json({ userId: tbluser.id, username: tbluser.username, token });
//         });      
//     });
//   });
// }catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ Result: "Failure", message: err.message });
//   }
// });


// const accountSid = 'ACa2dfad5fe250cd0a61df89f5ac971927';
// const authToken = '07f09f8f37010465ced0b40977da1e45';
// const twilioPhoneNumber = '+12512990421';
// const client = twilio(accountSid, authToken);

// app.use(bodyParser.json());
// const generateOTP = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };
// // Send OTP via SMS
// function sendOTP(organization_mobile_no, otp) {
//   return client.messages.create({
//     body: `Your OTP for login is: ${otp}`,
//     from: twilioPhoneNumber,
//     to: organization_mobile_no
//   });
// }

// const checkMobileNumberExists = (organization_mobile_no) => {     
//     con.connect(function(err) {
//       if (err) throw err;
//       console.log("Connected!");
//       console.log('organization mobile :', organization_mobile_no);
//       var sql = 'SELECT * FROM tbluser WHERE `organization_mobile_no` = ?';
//       con.query(sql, [organization_mobile_no], function (err, result) {
//         if (err) {
//           console.error('Error checking user credentials:', err);
//           console.log(result);         
//       }
//       console.log('database result',result.length);
//       return result.length;
// });
// });
// }


// // Update OTP in the database
// const updateOTPInDatabase = async (organization_mobile_no, otp) => {
//    con.query('UPDATE tbluser SET otp = ? WHERE organization_mobile_no = ?', [otp, organization_mobile_no]);
// };

// User login request
// app.post('/loginOtp',  (req, res) => {
//   const { organization_mobile_no } = req.body;

//   try {
//     const mobileExists =  checkMobileNumberExists(organization_mobile_no);
//     console.log('mobile exsists',mobileExists);
//     if (mobileExists==0) {
//       return res.status(404).json({ success: false, message: 'Mobile number not found' });
//     }
//     // Generate OTP
//     const otp = generateOTP();
//     // Send OTP
//     sendOTP(organization_mobile_no, otp)
//       .then(() => {
//         console.log(`OTP sent to ${organization_mobile_no}: ${otp}`);
//         // Update OTP in the database
//         updateOTPInDatabase(organization_mobile_no, otp)
//           .then(() => {
//             console.log('OTP updated in the database');
//             req.session.mobileNumber = organization_mobile_no;
//             res.json({ success: true, message: 'OTP sent successfully' });
//           })
//           .catch(error => {
//             console.error('Error updating OTP in the database:', error);
//             res.status(500).json({ success: false, error: 'Failed to update OTP in the database' });
//           });
//       })
//       .catch(error => {
//         console.error('Error sending OTP:', error);
//         res.status(500).json({ success: false, error: 'Failed to send OTP' });
//       });
//   } catch (error) {
//     console.error('Error logging in:', error);
//     res.status(500).json({ success: false, error: 'Failed to log in' });
//   }
// });

// // Verify OTP and login
// app.post('/verify', async (req, res) => {
//   const { otp } = req.body;
  
//   const organization_mobile_no = req.session.mobileNumber;
//   try {    
//     const rows =  con.query('SELECT otp FROM tbluser WHERE organization_mobile_no = ?', [organization_mobile_no]);
//     const savedOTP = rows.otp;
//     if (otp === savedOTP) {
//       // OTP verification successful
//      res.json({ success: true, message: 'Login successful', organization_mobile_no });
//     } else {
//       res.status(401).json({ success: false, message: 'Invalid OTP' });
//     }
//   } catch (error) {
//     console.error('Error verifying OTP:', error);
//     res.status(500).json({ success: false, error: 'Failed to verify OTP' });
//   }
// });


app.post('/adddepartment', (req, res) =>{
  res.header('Content-Type', 'application/json');
  try{
    const{department, updated_by} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `INSERT INTO tbldepartment ( department, updated_by, doc, created_date,  updated_at) VALUES (?,?, NOW(),NOW(), CURRENT_TIMESTAMP())`;
      con.query(sql, [department, updated_by], function (err, result) {
        if (err) throw err;
        console.log("record inserted");
        res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
      });
    });
  } catch   (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});


app.put('/updatedepartment',(req, res) => {
  res.header('Content-Type', 'application/json');

  try{
    const{id, department} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `UPDATE tbldepartment SET department =?, dou = NOW(), updated_at = CURRENT_TIMESTAMP() WHERE id =?`;
      con.query(sql, [department, id], function (err, result) {
        if (err) throw err;
        console.log("1 record updated");
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
      });
    });
  } catch   (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  } 
  
});


app.delete('/deletedepartment',(req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `DELETE FROM tbldepartment WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record deleted");
        res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
      });
    });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ Result: "Failure", message: e.message });
  }
});

app.get('/viewdepartment', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tbldepartment`;
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record viewed");
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }  
});


app.get('/department_dropdown', (req, res) => {
  try {
    const getAlldepartment = "select distinct department from tbldepartment";

    // Query the database
    con.query(getAlldepartment, (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        return res.status(500).json({ Result: "Failure", message: "Internal server error" });
      }

      // Extract HCR names from the query result
      const alldepartment = result.map(record => record.department);

      // Send the HCR names as a JSON response
      res.status(200).json({
        Result: "Success",
        message: "All department retrieved successfully",
        data: alldepartment
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});


app.get('/view_deparment_id', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tbldepartment WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record view");
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }  
});


app.get('/search_department', (req, res) => {
  let keyword = req.body.department;
  let sql = 'SELECT * FROM tbldepartment WHERE department LIKE ?';
   let temp = '%'.concat(keyword).concat('%');
  console.log('keyword : ',  temp);
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
      con.query(sql, [temp], function (err, result) {
      if (err) throw err;
      console.log("record view");
      res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
    });
  });
});


app.post('/add_designation', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    const { designation_role, } = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `INSERT INTO tbldesignation ( designation_role, doc, updated_at) VALUES (?, ?, NOW(), CURRENT_TIMESTAMP())`;
      con.query(sql, [ designation_role,], function (err, result) {
        if (err) {
          console.error('Error executing SQL query:', err);
          res.status(500).json({ Result: "Failure", message: "Failed to insert data" });
        } else {
          console.log("1 record inserted");
          res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
        }
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }  
});


app.put('/update_designtion', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id, designation_role, updated_by} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `UPDATE tbldesignation SET  designation_role =?, dou = NOW(), updated_by =?, updated_at = CURRENT_TIMESTAMP() WHERE id =?`;
      con.query(sql, [designation_role, updated_by, id], function (err, result) {
        if (err) throw err;
        console.log("1 record updated");
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
      });
    });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }    
  });

  app.get('/view_department', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `SELECT id, department, DATE_FORMAT(created_date, '%Y-%m-%d') AS created_date FROM tbldepartment ORDER BY id DESC`;
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log("Records viewed in reverse order");
          res.status(200).json({ Result: "Success", message: "Data viewed successfully in reverse order", result });
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }  
  });
  

  app.get('/view_designation_id',  (req, res)=> {

    res.header('Content-Type', 'application/json');
    try{
      const{id} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `SELECT * FROM tbldesignation WHERE id =?`;
        con.query(sql, [id], function (err, result) {
          if (err) throw err;
          console.log("record view :" + JSON.stringify(result));
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        });
        
      });
    } catch (err) {
       console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }    
    
  });

  app.get('/view_designation', (req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `SELECT * FROM tbldesignation ORDER BY id DESC`;
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log("record viewed");
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }       
  });


  app.delete('/delete_designation', (req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const{id} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `DELETE FROM tbldesignation WHERE id =?`;
        con.query(sql, [id], function (err, result) {
          if (err) throw err;
          console.log("record deleted");
          res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }      
  });

  app.get('/search_designation', (req, res)=> {
    const keyword = req.body.designation_role; 
    let sql = 'SELECT * FROM tbldesignation WHERE designation_role LIKE ?';
     let temp1 = '%'.concat(keyword).concat('%');
    console.log('keyword : ',  temp1);
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
        con.query(sql, [temp1], function (err, result) {
        if (err) throw err;
        console.log("record view :" + JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  });


  app.post('/add_classes', (req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const {classes_name, division, department, strength, hcr_name } = req.body;
      console.log(classes_name, division, department,strength, hcr_name);
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `INSERT INTO tblclasses ( classes_name, division, department,strength, hcr_name, last_update,  doc, updated_at) VALUES (?,?,?,?,?, NOW(), NOW(), CURRENT_TIMESTAMP())`;
        con.query(sql, [ classes_name, division, department,strength, hcr_name], function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ Result: "Failure", message: "Failed to insert data" });
          } else {
            console.log("1 record inserted");
            res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
          }
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }     
  });


 app.get('/view_classes', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tblclasses`;
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("record viewed");
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  } 
  
 });


 app.get('/view_classes_id', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tblclasses WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record view :" + JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
     console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  } 
  
 });

 app.put('/update_Strength', (req, res) => {
  // SQL query to update the strength in the classes table
  const sql = `
    UPDATE tblclasses AS c
    JOIN (
      SELECT classes, division, COUNT(*) AS strength 
      FROM tblstudent 
      GROUP BY classes, division
    ) AS s ON c.classes_name = s.classes AND c.division = s.division
    SET c.strength = s.strength `;

  // Execute the SQL query
  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error updating strength:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    console.log('Strength updated successfully');
    res.status(200).json({ message: 'Strength updated successfully' });
  });
});


 app.put('/update_classes', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id, classes_name, division, department,hcr} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `UPDATE tblclasses SET classes_name =?, division =?, department =?,strength=?, hcr_name =?,dou=NOW(), updated_at = CURRENT_TIMESTAMP() WHERE id =?`;
      con.query(sql, [classes_name, division, department,strength, hcr, id], function (err, result) {
        if (err) throw err;
        console.log("1 record updated");
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }
  
 });

 app.delete('/delete_classes', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `DELETE FROM tblclasses WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record deleted");
        res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  } 
  
 });

 app.get('/search_classes', (req, res) => {
  res.header('Content-Type', 'application/json');
  const keyword = req.body.classes_name;
  let sql = "SELECT * FROM tblclasses WHERE `classes_name` LIKE ? OR `division` LIKE ? OR `strength` LIKE ? OR `department` LIKE ? OR `hcr_name` LIKE ?";
  let temp1 = '%'.concat(keyword).concat('%');
  console.log('keyword : ',  temp1);
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
      con.query(sql, [temp1, temp1, temp1,temp1, temp1 ], function (err, result) {
      if (err) throw err;
      console.log("record view :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
    });
  }); 
 });


 app.get('/search_staff', (req, res) => {
  res.header('Content-Type', 'application/json');
  const keyword = req.body.name;
  let sql = "SELECT * FROM tblstaff WHERE `name` LIKE ? OR `division` LIKE ? OR `designation` LIKE ? OR `department` LIKE ? OR `department` LIKE ?";
  let temp1 = '%'.concat(keyword).concat('%');
  console.log('keyword : ',  temp1);
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
      con.query(sql, [temp1, temp1, temp1,temp1, temp1 ], function (err, result) {
      if (err) throw err;
      console.log("record view :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
    });
  }); 
 });



 app.get('/search_student', (req, res) => {
  res.header('Content-Type', 'application/json');
  const keyword = req.body.name;
  let sql = "SELECT * FROM tblstudent " +
            "INNER JOIN tblparent ON tblstudent.id_number = tblparent.id_number " +
            "WHERE `name` LIKE ? OR `division` LIKE ? OR `classes` LIKE ? OR `department` LIKE ? OR `address` LIKE ? OR `mobile_number` LIKE ?";
            let temp1 = '%'.concat(keyword).concat('%'); // Concatenating directly
  console.log('keyword : ',  temp1);
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
      con.query(sql, [temp1, temp1, temp1, temp1, temp1, temp1], function (err, result) {
      if (err) throw err;
      console.log("record view :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
    });
  }); 
});


 app.get('/hcrname_dropdown', (req, res) => {
  try {
    const getAllhcrnames = "SELECT name FROM tblstaff WHERE hcr = 1";

    // Query the database
    con.query(getAllhcrnames, (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        return res.status(500).json({ Result: "Failure", message: "Internal server error" });
      }
      // Extract HCR names from the query result
      const hcrNames = result.map(record => record.name);

      // Send the HCR names as a JSON response
      res.status(200).json({
        Result: "Success",
        message: "All HCR names retrieved successfully",
        data: hcrNames
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

app.post('/medicineused_add', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    const {student_name, hcr_name, sick_type, consult_id, division} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `INSERT INTO tblmedicine (student_name, hcr_name, sick_type, consult_id, division) VALUES (?,?,?,?,?)`;
      con.query(sql, [student_name, hcr_name, sick_type, consult_id, division], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
      });
    });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }  
});

app.get('/view_medicineused_by_id', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    const{id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tblmedicine WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record view :" + JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
     console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }
});

app.put('/update_medicineused', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const {id, student_name, hcr_name, sick_type, consult_id, division} = req.body;
    con.connect(function(err){
      if (err) throw err;
      console.log("Connected!");
      var sql = `UPDATE tblmedicine SET student_name =?, hcr_name =?, sick_type =?, consult_id =?, division =? WHERE id =?`;
      con.query(sql, [student_name, hcr_name, sick_type, consult_id, division, id], function (err, result) {
        if (err) throw err;
        console.log("1 record updated");
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }  
});


app.delete('/delete_medicineused', (req,res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `DELETE FROM tblmedicine WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record deleted");
        res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }   
 });


 app.post('/add_medicinelist', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const {medicine_list_id, medicine, symptoms, quantity} = req.body;
    con.connect(function(err){
      if (err) throw err;
      console.log("Connected!");
      var sql = `INSERT INTO tblmedicine_list (medicine_list_id, medicine, symptoms, quantity) VALUES (?,?,?,?)`;
      con.query(sql, [medicine_list_id, medicine, symptoms, quantity], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
      });
    });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ Result: "Failure", message: e.message });
  }   
 });

 app.put('/update_medicine_list', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{medicine_list_id, medicine, symptoms, quantity} = req.body;
    con.connect(function(err){
      if(err) throw err;
      console.log("Connected!");
      var sql = `UPDATE tblmedicine_list SET medicine =?, symptoms =?, quantity =? WHERE medicine_list_id =?`;
      con.query(sql, [medicine, symptoms, quantity, medicine_list_id], function (err, result) {
        if (err) throw err;
        console.log("1 record updated");
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
      });
  });
} catch (err) {
  console.error('Error:', err);
  res.status(500).json({ Result: "Failure", message: err.message });
} 
  
 });

app.get('/view_medicine_list', (req, res) => {
res.header('Content-Type', 'application/json');
try {
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = `SELECT * FROM tblmedicine_list`;
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("record view :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
    });
  });
} catch (e) {
  console.error('Error:', e);
  res.status(500).json({ Result: "Failure", message: e.message });
}
  
});


//medicine stock

app.put('/update_quantity_and_provided', (req, res) => {
  // SQL query to update quantity in tblmedicine based on provide=1 and set provided=1 in tblprescriptiondetails
  const sql = `
      UPDATE tblmedicine_list m
      INNER JOIN tblprescriptiondetails p ON m.medicine = p.medicine_name
      SET 
          m.quantity = m.quantity - p.count,
          p.provided = 1
      WHERE p.provided = 2`;

  // Execute the SQL query
  con.query(sql, (err, result) => {
      if (err) {
          console.error('Error updating quantity and provided:', err);
          return res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
      }

      const affectedRows = result ? result.affectedRows : 0;
      res.status(200).json({ result: 'success', message: `Quantity updated for ${affectedRows} medicines. Updated provided to 1 for ${affectedRows} prescriptions` });
  });
});
  
app.get('/view_medicine_list_byid', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{medicine_list_id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tblmedicine_list WHERE medicine_list_id =?`;
      con.query(sql, [medicine_list_id], function (err, result) {
        if (err) throw err;
        console.log("record view :" + JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }  
});  

app.delete('/delete_medicine_list', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{medicine_list_id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `DELETE FROM tblmedicine_list WHERE medicine_list_id =?`;
      con.query(sql, [medicine_list_id], function (err, result) {
        if (err) throw err;
        console.log("record deleted");
        res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }
  
});


// appointment booking
//to view student name and class and division of students.

app.get('/consulting_detail', (req, res) => {
  const id_number = req.body.id_number;

  // Define SQL queries to fetch details from student and staff tables based on ID number
  const studentQuery = 'SELECT name, classes, division FROM tblstudent WHERE id_number = ?';
  const staffQuery = 'SELECT name, classes, division FROM tblstaff WHERE id_number = ?';

  con.query(studentQuery, id_number, (err, studentResult) => {
    if (err) {
      console.error('Error fetching student details:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    con.query(staffQuery, id_number, (err, staffResult) => {
      if (err) {
        console.error('Error fetching staff details:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Combine the results from both queries and send as response
      const details = {
        student: studentResult[0], // Assuming there is only one matching student
        staff: staffResult[0]      // Assuming there is only one matching staff
      };

      res.status(200).json(details);
    });
  });
});



app.post('/insert_appointment', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{ 
    
  const { id_number, patient_name,classes, division, health_problem, sick_type, hcr_name, assignee, date, from_time } = req.body;
   
  let status = 'new';
  
  var sql=`insert into tblconsulting (id_number, patient_name, classes, division,health_problem, sick_type, hcr_name, assignee, date, from_time, status ) values (?,?,?,?,?,?,?,?,?,?,?)`;
  con.query(sql, [id_number, patient_name, classes, division, health_problem, sick_type, hcr_name, assignee, date, from_time, status], function (err, result) {
    if (err) throw err;
    console.log("record inserted :" + JSON.stringify(result));
    res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
  });
} catch (e) {
  console.error('Error:', e);
  res.status(500).json({ Result: "Failure", message: e.message });
}
});

app.post('/viewbyid_appointment_detail', (req, res) => {
  res.header('Content-Type', 'application/json');
  const id_number = req.body.id_number;

  const studentview = `SELECT c.id_number, c.consult_id, c.patient_name, c.classes, c.division, c.hcr_name, c.sick_type, c.health_problem, c.assignee, c.date,TIME_FORMAT(c.from_time, '%h:%i %p') AS from_time, TIME_FORMAT(c.to_time, '%h:%i %p') AS to_time,  TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age FROM tblconsulting c INNER JOIN tblstudent s ON s.id_number=c.id_number WHERE c.id_number = ?`;

  const staffview = `SELECT c.id_number, c.consult_id, c.patient_name, c.classes, c.division, c.hcr_name, c.sick_type, c.health_problem, c.assignee, c.date, TIME_FORMAT(c.from_time, '%h:%i %p') AS from_time, TIME_FORMAT(c.to_time, '%h:%i %p') AS to_time,  TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) AS age FROM tblconsulting c INNER JOIN tblstaff t ON t.id_number=c.id_number WHERE c.id_number = ?`;

  // Define SQL queries to fetch details from student and staff tables based on ID number
  // const studentview = `SELECT c.id_number, c.consult_id, c.patient_name, c.classes, c.division, c.hcr_name, c.sick_type, c.health_problem, c.assignee, c.date,  CONCAT(DATE_FORMAT(c.from_time, '%h:%i %p'), IFNULL(CONCAT(' - ', DATE_FORMAT(c.to_time, '%h:%i %p')), '')) AS time,  TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age FROM tblconsulting c INNER JOIN tblstudent s ON s.id_number=c.id_number WHERE c.id_number = ?`;


  // const staffview = `SELECT c.id_number, c.consult_id, c.patient_name, c.classes, c.division, c.hcr_name, c.sick_type, c.health_problem, c.assignee, c.date, CONCAT(DATE_FORMAT(c.from_time, '%h:%i %p'), IFNULL(CONCAT(' - ', DATE_FORMAT(c.to_time, '%h:%i %p')), '')) AS time, TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) AS age FROM tblconsulting c INNER JOIN tblstaff t ON t.id_number=c.id_number WHERE c.id_number = ?`;

  con.query(studentview, id_number, (err, studentResult) => {
    if (err) {
      console.error('Error fetching student details:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    con.query(staffview, id_number, (err, staffResult) => {
      if (err) {
        console.error('Error fetching staff details:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Combine the results from both queries and send as response
      const details = {
        student: studentResult[0], // Assuming there is only one matching student
        staff: staffResult[0]      // Assuming there is only one matching staff
      };

      res.status(200).json(details);
    });
  });
});


app.get('/viewall_appointment_details', (req, res) =>{
  res.header('Content-Type', 'application/json');
  try {
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT status, consult_id, patient_name, sick_type, hcr_name, assignee, 
      CONCAT(DATE_FORMAT(date, '%d-%m'), ' ', DATE_FORMAT(from_time, '%h:%i %p'),' - ',DATE_FORMAT(to_time, '%h:%i %p')) AS date_time FROM tblconsulting`;     
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("record view :" + JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  } 
});


app.put('/edit_appointment_details', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const {consult_id, patient_name,  classes, division, health_problem, sick_type, hcr_name, assignee, date, from_time} = req.body;
    
    let status = 'new';
    
    var sql=`update tblconsulting set patient_name =?, classes =?, division =?, health_problem =?, sick_type =?, hcr_name =?, assignee =?, date =?, from_time = ?, status =? where consult_id =?`;
    con.query(sql, [patient_name, classes, division, health_problem, sick_type, hcr_name, assignee, date, status, from_time, consult_id], function (err, result) {
      if (err) throw err;
      console.log("record updated :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
    });
    } catch (e) {
      console.error('Error:', e);
      res.status(500).json({ Result: "Failure", message: e.message });
    }  
});

app.put('/update_status_waiting', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{ 
    const {consult_id} = req.body;  
    var sql=`update tblconsulting set status = "waiting", where consult_id =?`;
    con.query(sql, [ consult_id], function (err, result) {
      if (err) throw err;
      console.log("record updated :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
    });
    } catch (e) {
      console.error('Error:', e);
      res.status(500).json({ Result: "Failure", message: e.message });
    }  
});

app.put('/update_status_cancel', (req, res)=> {
  res.header('Content-Type', 'application/json');
  try{
    const {consult_id} = req.body;  
    var sql = `update tblconsulting set status = "cancel" where consult_id =?`;
    con.query(sql, [consult_id], function (err, result) {
      if (err) throw err;
      console.log("record updated :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
    });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ Result: "Failure", message: e.message });
  }
  
});

app.put('/update_status_closed', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const {consult_id, to_time} = req.body;  
    var sql = `update tblconsulting set status = "closed", to_time = ? where consult_id = ?`;
    con.query(sql, [consult_id, to_time], function (err, result) {
      if (err) throw err;
      console.log("record updated :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
    });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ Result: "Failure", message: e.message });
  }
});

app.delete('/single_delete_appointment', (req,res) => {
  res.header('Content-Type', 'application/json');
  try{
    const {consult_id} = req.body;  
    var sql = `delete from tblconsulting where consult_id =?`;
    con.query(sql, [consult_id], function (err, result) {
      if (err) throw err;
      console.log("record deleted :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
    });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ Result: "Failure", message: e.message });
  }  
});

app.delete('/multiple_delete_appointment', (req,res) => {
  try {
    const { consult_id } = req.body; // Assuming ids is an array of appointment IDs to delete

    // Check if ids array is provided
    if (!consult_id || !Array.isArray(consult_id) || consult_id.length === 0) {
        return res.status(400).json({ result: 'failure', message: 'Please provide an array of appointment IDs to delete' });
    }

    // Construct the SQL query to delete appointments
    const sql = `DELETE FROM tblconsulting WHERE consult_id IN (?)`;

    // Execute the SQL query
    con.query(sql, [consult_id], (err, result) => {
        if (err) {
            console.error('Error deleting appointments:', err);
            return res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
        }

        const affectedRows = result ? result.affectedRows : 0;
        res.status(200).json({ result: 'success', message: `${affectedRows} appointments deleted successfully` });
    });
} catch (ex) {
    console.error('Exception:', ex);
    res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
}
});



// Prescription before provide

app.get('/viewbyid_prescription_before_provide', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
   
    const consult_id = req.body.consult_id; 
    
    let selectPrescriptionQuery = `
    SELECT distinct
        COALESCE(s.profile, st.profile) AS profile,
        c.patient_name,
        c.id_number,
        CASE 
        WHEN s.id_number IS NOT NULL THEN CONCAT(s.classes,'/', s.division)
        ELSE CONCAT(st.department, '/', st.designation)
    END AS class,
        CASE
        WHEN s.dob IS NOT NULL THEN s.dob
        ELSE st.dob
    END AS dob,
    DATEDIFF(CURRENT_DATE(), 
             CASE
                 WHEN s.dob IS NOT NULL THEN s.dob
                 ELSE st.dob
             END) / 365 AS age,
        c.consult_id,
        DATE_FORMAT(c.date, '%d-%m-%y') AS date,
        CONCAT(DATE_FORMAT(c.from_time, '%h:%i %p'), ' - ', DATE_FORMAT(c.to_time, '%h:%i %p')) AS time,
        c.hcr_name,
        
        CASE WHEN p.mobile_number IS NOT NULL THEN p.mobile_number ELSE st.mobile_number END AS parent_mobile, 
        c.assignee,
        c.sick_type,
        c.health_problem,
        pd.prescriptiondetails_id,
        pd.medicine_name, 
        CONCAT_WS('-',
            CASE WHEN pd.period = 'morning' THEN '1' ELSE '0' END,
            CASE WHEN pd.period = 'afternoon' THEN '1' ELSE '0' END,
            CASE WHEN pd.period = 'evening' THEN '1' ELSE '0' END,
            CASE WHEN pd.period = 'night' THEN '1' ELSE '0' END
        ) AS periods,
        pd.symptom, 
        pd.days, 
        pd.food,
        pd.count
    FROM 
        tblconsulting c
    INNER JOIN 
        tblprescriptiondetails pd ON c.consult_id = pd.consult_id
    LEFT JOIN 
        tblstudent s ON c.id_number = s.id_number
        
    LEFT JOIN 
        tblstaff st ON c.id_number = st.id_number
    LEFT JOIN 
        tblparent p ON p.id_number = s.id_number `;

    // If consult_id is provided, filter by it
    if (consult_id) {
      selectPrescriptionQuery += ' WHERE c.consult_id = ?';
    }

    console.log('SQL Query:', selectPrescriptionQuery); // Log SQL query

    // Execute the query with consult_id if provided
    con.query(selectPrescriptionQuery, [consult_id], (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({
          result: 'failure',
          message: 'Internal Server Error'
        });
      }

      // Check if prescription details were found
      if (result.length === 0) {
        return res.status(404).json({
          result: 'failure',
          message: 'Prescription details not found'
        });
      }

      console.log('Prescription details retrieved successfully');

      const generalPrescriptionSet = new Set(); // Using a Set to ensure unique general prescription details
      const consultationDetailsSet = new Set(); // Using a Set to ensure unique consultation details
      const medicineDetailsSet = new Set(); // Using a Set to ensure unique medicine details

      result.forEach(row => {
        // Calculate age from date of birth
        const dob = new Date(row.dob);
        const ageDiffMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDiffMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        // Add general prescription details to the Set
        generalPrescriptionSet.add(JSON.stringify({
          profile: row.profile,
          patient_name: row.patient_name,
          id_number: row.id_number,
          class: row.class,
          age: age, 
          consult_id: row.consult_id,
          date: row.date,
          time: row.time,
          hcr_name: row.hcr_name,
          hcr_mobile_no: row.hcr_mobile_no,
          parent_mobile: row.parent_mobile,
          doctor_name: row.assignee,
        }));

        // Add consultation details to the Set
        consultationDetailsSet.add(JSON.stringify({
          sick_type: row.sick_type,
          consult_id: row.consult_id,
          health_problem: row.health_problem,
        }));

        // Add medicine details to the Set
        medicineDetailsSet.add(JSON.stringify({
          prescriptiondetails_id:row.prescriptiondetails_id,
          consult_id: row.consult_id,
          medicine_name: row.medicine_name,
          periods: row.periods,
          symptom: row.symptom,
          days: row.days,
          food: row.food,
          count: row.count,
        }));
      });

      // Convert Sets to Arrays
      const generalPrescriptionArray = Array.from(generalPrescriptionSet).map(JSON.parse);
      const genPresArray=[];
      let switched = false;
      for(let i=0;i<= generalPrescriptionArray.length-1;i++)
      {   
        if(generalPrescriptionArray.length ==1)
        {
          genPresArray.push(generalPrescriptionArray[i]);
          break;
        }
        if(switched)
        {
          switched= false;
          continue;
        }
        
        let lstIndex = generalPrescriptionArray.length-1;
        let j = i +1;
        if(generalPrescriptionArray[i].id_number==generalPrescriptionArray[j].id_number)
        {
          console.log('I is ',i , ' j is : ', j );
          genPresArray.push(generalPrescriptionArray[i]);
          switched= true;
        }           
      }
      const consultationDetailsArray = Array.from(consultationDetailsSet).map(JSON.parse);
      const medicineDetailsArray = Array.from(medicineDetailsSet).map(JSON.parse);

      res.status(200).json({
        result: 'success',
        message: 'Prescription Details Retrieved Successfully',
       // general_prescription: generalPrescriptionArray,
       general_prescription: genPresArray,
        consultation_details: consultationDetailsArray,
        medicine_details: medicineDetailsArray
      });
    });
  } catch (ex) {
    console.error('Exception:', ex);
    res.status(500).json({
      result: 'failure',
      message: 'Internal Server Error'
    });
  }
});




app.post('/pills_provided', (req, res) => {
  const checkboxUpdates = req.body;

    const promises = checkboxUpdates.map(update => {
        const { prescriptiondetails_id, provided } = update;
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE tblprescriptiondetails SET provided = ? WHERE prescriptiondetails_id = ?';
            const checkboxValue = provided ? 2 : 0;
            con.query(sql, [checkboxValue, prescriptiondetails_id], (err, result) => {
                if (err) {
                    console.error(`Error updating checkbox ${prescriptiondetails_id} state:`, err);
                    reject(err);
                } else {
                    console.log(`Checkbox state updated for ID ${prescriptiondetails_id}`);
                    resolve(result);
                }
            });
        });
    });

    Promise.all(promises)
        .then(() => {
            res.status(200).json({ message: 'Checkbox states updated successfully' });
        })
        .catch((err) => {
            res.status(500).json({ error: 'Internal server error' });
        });
});

app.get('/viewall_medicineinventory', (req, res) => {
  res.header('Content-Type', 'application/json');
  
  const sql = `
      SELECT 
          c.patient_name, 
          c.id_number, 
          c.consult_id, 
          c.hcr_name, 
          DATE_FORMAT(c.date, '%b %d, %Y') AS date,
          p.prescriptiondetails_id,
          p.consult_id, 
          p.medicine_name,
          m.hsn_code,
          p.count   
      FROM 
          tblconsulting c 
      INNER JOIN 
          tblprescriptiondetails p 
      ON 
          p.consult_id = c.consult_id 
      INNER JOIN 
          tblmedicine_list m 
      ON 
          m.medicine = p.medicine_name
      WHERE 
          p.provided = 1`;

  con.query(sql, (err, result) => {
      if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
      }

      const medicineinventory = new Set(); 
      const medicineDetailsSet = new Set();

      result.forEach(row => {
          medicineinventory.add(JSON.stringify({
              patient_name: row.patient_name,
              id_number: row.id_number,
              consult_id: row.consult_id,
              date: row.date,        
              hcr_name: row.hcr_name,
          }));

          medicineDetailsSet.add(JSON.stringify({
            prescriptiondetails_id: row.prescriptiondetails_id,
            consult_id:row.consult_id,
              medicine_name: row.medicine_name,
              hsn_code: row.hsn_code,        
              count: row.count,
          }));
      });
    
      const medicineinventoryArray = Array.from(medicineinventory).map(JSON.parse);
      const medicineDetailsArray = Array.from(medicineDetailsSet).map(JSON.parse);

      res.status(200).json({
          result: 'success',
          message: 'Prescription Details Retrieved Successfully',
          general_prescription: medicineinventoryArray,
          medicine_details: medicineDetailsArray
      });
  });    
});


app.get('/search_medicineinventory', (req, res) => {
  res.header('Content-Type', 'application/json');
  
  const keyword  = req.body.patient_name;
  let temp1 = '%'.concat(keyword).concat('%');
  console.log('keyword : ',  temp1);

  // Build the SQL query dynamically based on the provided keyword
  let sql = `
      SELECT 
          c.patient_name, 
          c.id_number, 
          c.consult_id, 
          c.hcr_name, 
          c.date, 
          p.medicine_name,
          m.hsn_code,
          p.count   
      FROM 
          tblconsulting c 
      INNER JOIN 
          tblprescriptiondetails p 
      ON 
          p.consult_id = c.consult_id 
      INNER JOIN 
          tblmedicine_list m 
      ON 
          m.medicine = p.medicine_name
      WHERE 
          p.provided = 1 AND 
          (
              c.patient_name LIKE '%${keyword}%' OR
              c.id_number LIKE '%${keyword}%' OR
              c.consult_id LIKE '%${keyword}%' OR
              c.hcr_name LIKE '%${keyword}%' OR
              c.date LIKE '%${keyword}%' OR
              p.medicine_name LIKE '%${keyword}%' OR
              m.hsn_code LIKE '%${keyword}%' OR
              p.count LIKE '%${keyword}%'
          )`;

  // Execute the SQL query
  con.query(sql, (err, result) => {
      if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
      }

      // Format the response
      const medicineinventory = new Set(); 
      const medicineDetailsSet = new Set();

      result.forEach(row => {
          medicineinventory.add(JSON.stringify({
              patient_name: row.patient_name,
              id_number: row.id_number,
              consult_id: row.consult_id,
              date: row.date,        
              hcr_name: row.hcr_name,
          }));

          medicineDetailsSet.add(JSON.stringify({
              id: row.id,
              medicine_name: row.medicine_name,
              hsn_code: row.hsn_code,        
              count: row.count,
          }));
      });
    
      const medicineinventoryArray = Array.from(medicineinventory).map(JSON.parse);
      const medicineDetailsArray = Array.from(medicineDetailsSet).map(JSON.parse);

      res.status(200).json({
          result: 'success',
          message: 'Prescription Details Retrieved Successfully',
          general_prescription: medicineinventoryArray,
          medicine_details: medicineDetailsArray
      });
  });    
});





    // app.post('/insertstudentsdetails',(req,res) => {
    
    //   res.header('Content-Type', 'application/json');
    //   try {
    //     const {profile,name, id_number, address,gender,state,pincode, classes, division, dob, blood_group, allergies, allergies_define, any_disease, any_disease_define, current_health_report,past_health_report, updated_by} = req.body;
    //     con.connect(function(err) {
    //       if (err) throw err;
    //       console.log("Connected!");
    //       var sql = `INSERT INTO tblstudent (profile,name, id_number, address,gender,state,pincode, classes, division, dob, blood_group, allergies, allergies_define, any_disease, any_disease_define, current_health_report,past_health_report,doc, updated_at, updated_by) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(),CURRENT_TIMESTAMP(), ?)`;
    //       con.query(sql, [profile,name, id_number, address,gender,state,pincode, classes, division, dob, blood_group, allergies, allergies_define, any_disease, any_disease_define, current_health_report,past_health_report, updated_by], 
    //           function (err, result) {
    //            if (err) throw err;
    //           console.log("1 record inserted");
    //           res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
    //         });
    //       });    
         
    //     } catch (ex) {
    //       console.error('Error:', ex);
    //       res.status(500).json({ Result: "Failure", message: ex.message });
    //     }
    //   });
  
    //   app.get('/viewstudentid',async (req, res)=>{
    //       res.header('Content-Type', 'application/json');
    //       try {
    //         const {id}  = req.body;
    //         // Get a connection from the pool
    //         con.connect(function(err) {
    //           if (err) throw err;
    //           console.log("Connected!");
    //           var sql = `SELECT * FROM tblstudent WHERE id =?`;
    //             con.query(sql, [id], function (err, result) {
    //             if (err) throw err;
    //             console.log("1 record shown");
    //             res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
    //           });
    //         });
        
    //       } catch   (ex) {
    //         console.error('Error:', ex);
    //         res.status(500).json({ Result: "Failure", message: ex.message });
    //       }
    //     });
  
        // app.get('/viewallstudent',async (req, res)=>{
  
        //   res.header('Content-Type', 'application/json');
        //   try {
        //     // Get a connection from the pool
        //     con.connect(function(err) {
        //       if (err) throw err;
        //       console.log("Connected!");
        //       var sql = `SELECT * FROM tblstudent where (is_deleted = 0 OR is_deleted IS NULL)`;
        //         con.query(sql, function (err, result) {
        //         if (err) throw err;
        //         console.log("1 record inserted");
        //         res.status(200).json({ Result: "Success", message: "All data view Successfully", result });
        //       });
        //     });
        //   }catch   (ex) {
        //     console.error('Error:', ex);
        //     res.status(500).json({ Result: "Failure", message: ex.message });
        //   }
        //   });
  
          // app.put('/update_student', (req, res)=>{
          //     res.header('Content-Type', 'application/json');
          //        try {
          //        const {profile,name, address,gender,state,pincode, classes, division, dob, blood_group, allergies, allergies_define, any_disease, any_disease_define, current_health_report,past_health_report, updated_by, id_number}  = req.body;
          //        // Get a connection from the pool
          //        con.connect(function(err) {
          //            if (err) throw err;
          //            console.log("Connected!");
          //            var sql = `UPDATE tblstudent SET profile=?,name =?, address =?,gender =?,state =?,pincode =?, classes =?, division =?, dob =?, blood_group =?, allergies =?, allergies_define =?, any_disease =?, any_disease_define =?, current_health_report =?,past_health_report =?,dou =NOW(), updated_at = NOW(), updated_by =? WHERE id_number =?`;
          //            con.query(sql, [profile,name, address,gender,state,pincode, classes, division, dob, blood_group, allergies, allergies_define, any_disease, any_disease_define, current_health_report,past_health_report, updated_by,id_number], 
          //                function (err, result) {
          //                    if (err) throw err;
          //                    console.log("1 record updated");
          //                    res.status(200).json({ Result: "Success", message: "Data updated Successfully", result });
          //                  });
          //                });
          //        }catch   (ex) {
          //          console.error('Error:', ex);
          //          res.status(500).json({ Result: "Failure", message: ex.message });
          //        }
          //    });
  
          //    app.delete('/delete_student', (req, res)=> {
          //     res.header('Content-Type', 'application/json');
          //     try {
          //       const {id_number}  = req.body;
          //       // Get a connection from the pool
          //       con.connect(function(err) {
          //         if (err) throw err;
          //         console.log("Connected!");
          //         var sql =`DELETE FROM tblstudent WHERE id_number =?`;
          //           con.query(sql, [id_number], function (err, result) {
          //           if (err) throw err;
          //           console.log("1 record deleted");
          //           res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
          //         });
          //       });
          //     } catch (err) {
          //       console.error('Error:', err);
          //       res.status(500).json({ Result: "Failure", message: err.message });
          //     }
          //   });
  //----------------------------------------------------------------
  //parent
  // app.post('/insert_parent', (req, res) => {
  //   res.header('Content-Type', 'application/json');
  
  //   try {
  //     const {id_number, parent_name, relation, mobile_number, updated_by} = req.body;
  
  //     // Get a connection from the pool
  //     con.connect(function(err) {
  //       if (err) throw err;
  //       console.log("Connected!");
  //       var sql = `INSERT INTO tblparent ( id_number, parent_name, relation, mobile_number, doc, updated_at, updated_by) VALUES ( ?, ?, ?, ?, NOW(), CURRENT_TIMESTAMP(), ?)`;
  //       con.query(sql, [ id_number, parent_name, relation, mobile_number, updated_by], 
  //         function (err, result) {
  //          if (err) throw err;
  //         console.log("1 record inserted");
  //         res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
  //       });
  //     });    
     
  //   } catch (ex) {
  //     console.error('Error:', ex);
  //     res.status(500).json({ Result: "Failure", message: ex.message });
  //   }
  // });
  
  
  // app.get('/parent_viewbyid', (req, res) => {
  //   res.header('Content-Type', 'application/json');
    
  //   try {
  //     const {id_number} = req.body;
    
  //     // Get a connection from the pool
  //     con.connect(function(err) {
  //       if (err) throw err;
  //       console.log("Connected!");
  //       var sql = `SELECT * FROM tblparent WHERE id_number =?`;
  //       con.query(sql, [id_number], function (err, result) {
  //        if (err) throw err;
  //        console.log("1 record shown");
  //        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
  //      });
  //     });    
  //   } catch (ex) {
  //     console.error('Error:', ex);
  //     res.status(500).json({ Result: "Failure", message: ex.message });
  //   }
  // });
  
  // app.get('/view_all_parent',(req, res) => {
  // res.header('Content-Type', 'application/json');
  
  // try {
  //   // Get a connection from the pool
  //   con.connect(function(err) {
  //     if (err) throw err;
  //     console.log("Connected!");
  //     var sql = `SELECT * FROM tblparent`;
  //     con.query(sql, function (err, result) {
  //      if (err) throw err;
  //      console.log("all record shown");
  //      res.status(200).json({ Result: "Success", message: "Data all records view Successfully", result });
  //    });
  //   });    
  // } catch (ex) {
  //   console.error('Error:', ex);
  //   res.status(500).json({ Result: "Failure", message: ex.message });
  // }
  // });
  
  // app.put('/update_parent', (req, res) => {
  // res.header('Content-Type', 'application/json');
  // try{
  // const {parent_name, relation, mobile_number, updated_by, id_number} = req.body;
  // console.log(parent_name, relation, mobile_number, updated_by, id_number);
  
  // // Get a connection from the pool
  // con.connect(function(err) {
  //   if (err) throw err;
  //   console.log("Connected!");
  //   var sql = `UPDATE tblparent SET parent_name = ?, relation = ?, mobile_number = ?, dou = NOW(), updated_at = NOW(), updated_by =? WHERE id_number =?`;
  // con.query(sql, [parent_name, relation, mobile_number, updated_by, id_number], 
  //     function (err, result) {
  //      if (err) throw err;
  //      console.log("1 record updated");
  //      res.status(200).json({ Result: "Success", message: "Data updated Successfully", result });
  //    });
  //   });
  //   } catch (ex) {
  //     console.error('Error:', ex);
  //     res.status(500).json({ Result: "Failure", message: ex.message });
  //   }
  // });
  
  // app.delete('/delete_parent', (req, res)=> {
  //   res.header('Content-Type', 'application/json');
  //   try {
  //     const {id}  = req.body;
  //     // Get a connection from the pool
  //     con.connect(function(err) {
  //       if (err) throw err;
  //       console.log("Connected!");
  //       var sql =`DELETE FROM tblparent WHERE id =?`;
  //         con.query(sql, [id], function (err, result) {
  //         if (err) throw err;
  //         console.log("1 record deleted");
  //         res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
  //       });
  //     });
  //   } catch (err) {
  //     console.error('Error:', err);
  //     res.status(500).json({ Result: "Failure", message: err.message });
  //   }
  // });

 //submit student and parent button

 

//  // Function to convert image to base64
// function convertImageToBase64(image) {
//   // Your implementation here
// }


        //---------------------------- ELANCHEZHIAN --------------------------------

        //          STAFF'S DETAILS LOGIN WITH ORGANIZATION NAME

        app.post('/loginstaffs', (req, res) => {
          res.header('Content-Type', 'application/json');
          try {
              const { name, password } = req.body;
              // Get a connection from the pool
              con.connect(function (err) {
                  if (err) throw err;
                  console.log("Connected!");
                  var sql = `SELECT * FROM tblstaff WHERE name = ?`;
                  con.query(sql, [name], function (err, result) {
                      if (err) throw err;
                      if (result.length > 0) {
                          if (result[0].password === password) {
                              console.log("Login successful");
                              const token = jwt.sign({ userId: result[0].id, name: result[0].name, organization_name: result[0].organization_name }, '605001', { expiresIn: '1h' });
        
                              // Include user ID in the response
                              res.status(200).json({ userId: result[0].id, name: result[0].name, organization_name: result[0].organization_name, token, Result: "Success", message: "Login successful" });
                          } else {
                              console.log("Login failed: Incorrect password");
                              res.status(401).json({ Result: "Failure", message: "Login failed: Incorrect password" });
                          }
                      } else {
                          console.log("Login failed: User not found");
                          res.status(401).json({ Result: "Failure", message: "Login failed: User not found" });
                      }
                  });
              });
          } catch (err) {
              console.error('Error:', err);
              res.status(500).json({ Result: "Failure", message: err.message });
          }
        });
        
        app.put('/forget_staff_pw', (req, res)=> {
          res.header('Content-Type', 'application/json');
          try {
              const { name, password, id} = req.body;
              console.log(name, password, id);
              
              // Get a connection from the pool
              con.connect(function(err) {
                  if (err) throw err;
                  console.log("Connected!");
                  
                  // Update the password in the database
                  var sql = `UPDATE tblstaff SET password=?, name=? WHERE id=?`;
                  con.query(sql, [password, name, id], function(err, result) {
                      if (err) throw err;
                      console.log("Record updated successfully");
                      res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
                  });
              });
          } catch (ex) {
              console.error('Error:', ex);
              res.status(500).json({ Result: "Failure", message: ex.message });
          }
        });
        
        const accountSid = 'ACa2dfad5fe250cd0a61df89f5ac971927';
        const authToken = '07f09f8f37010465ced0b40977da1e45';
        const twilioPhoneNumber = '+12512990421';
        const client = twilio(accountSid, authToken);
        
        app.use(bodyParser.json());
        const generateOTP = () => {
          return Math.floor(100000 + Math.random() * 900000).toString();
        };
        // Send OTP via SMS
        function sendOTP(mobile_number, otp) {
          return client.messages.create({
            body: `Your OTP for login is: ${otp}`,
            from: twilioPhoneNumber,
            to: mobile_number
          });
        }
        
        const checkMobileNumberExists = (mobile_number) => {     
            con.connect(function(err) {
              if (err) throw err;
              console.log("Connected!");
              console.log('organization mobile :', mobile_number);
              var sql = 'SELECT * FROM tblstaff WHERE `mobile_number` = ?';
              con.query(sql, [mobile_number], function (err, result) {
                if (err) {
                  console.error('Error checking user credentials:', err);
                  console.log(result);         
              }
              console.log('database result',result.length);
              return result.length;
        });
        });
        }
        
        
        // Update OTP in the database
        const updateOTPInDatabase = async (mobile_number, otp) => {
           con.query('UPDATE tblstaff SET otp = ? WHERE mobile_number = ?', [otp, mobile_number]);
        };
        
        // User login request
        app.post('/loginotpstaff',  (req, res) => {
          const { mobile_number } = req.body;
        
          try {
            const mobileExists =  checkMobileNumberExists(mobile_number);
            console.log('mobile exsists',mobileExists);
            if (mobileExists==0) {
              return res.status(404).json({ success: false, message: 'Mobile number not found' });
            }
            // Generate OTP
            const otp = generateOTP();
            // Send OTP
            sendOTP(mobile_number, otp)
              .then(() => {
                console.log(`OTP sent to ${mobile_number}: ${otp}`);
                // Update OTP in the database
                updateOTPInDatabase(mobile_number, otp)
                  .then(() => {
                    console.log('OTP updated in the database');
                    req.session.mobileNumber = mobile_number;
                    console.log(req.session.mobileNumber);
                    res.json({ success: true, message: 'OTP sent successfully' });
                  })
                  .catch(error => {
                    console.error('Error updating OTP in the database:', error);
                    res.status(500).json({ success: false, error: 'Failed to update OTP in the database' });
                  });
              })
              .catch(error => {
                console.error('Error sending OTP:', error);
                res.status(500).json({ success: false, error: 'Failed to send OTP' });
              });
          } catch (error) {
            console.error('Error logging in:', error);
            res.status(500).json({ success: false, error: 'Failed to log in' });
          }
        });
        
        // Verify OTP and login
        app.post('/verifyotpstaff', (req, res) => {
          const { otp } = req.body;
          const mobile_number = req.session.mobileNumber;
        
          try {
            if (!mobile_number) {
              return res.status(400).json({ success: false, message: 'Mobile number not found in session' });
            }
        
            // Query the database for the OTP associated with the mobile number
            con.query('SELECT otp FROM tblstaff WHERE mobile_number = ?', [mobile_number], (err, rows) => {
              if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
              }
        
              if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Mobile number not found' });
              }
        
              const savedOTP = rows[0].otp;
        
              if (otp === savedOTP) {
                // OTP verification successful
                // You can perform additional actions here, such as logging the user in
                res.json({ success: true, message: 'OTP verification successful' });
              } else {
                res.status(401).json({ success: false, message: 'Invalid OTP' });
              }
            });
          } catch (error) {
            console.error('Error verifying OTP:', error);
            res.status(500).json({ success: false, error: 'Failed to verify OTP' });
          }
        });

        // app.post('/staffdetails', (req, res) => {
        //   res.header('Content-Type', 'application/json');
        
        //   try {
        //     // Extract other necessary data from req.body
        //     const { name, id_number, password, address, gender, state, pincode, classes, division, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, mobile_number, hcr, updated_by, organization_name } = req.body;
        
        //     const { profile, current_health_report, past_health_report } = req.body;
        
        //     var profileBase64 = convertImageToBase64(profile, "png");
        //     var currentBase64 = convertImageToBase64(current_health_report, "png");
        //     var pastBase64 = convertImageToBase64(past_health_report, "png");
        
        //     let role = hcr == 1 ? "hcr" : "staff";
        
        //     con.connect(function (err) {
        //       if (err) {
        //         console.error('Error connecting to database:', err);
        //         return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
        //       }
              
        //       console.log("Connected to database!");
        //       var sql = `INSERT INTO tblstaff (profile, name, id_number, password, address, gender, state, pincode, classes, division, dob, age, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report, mobile_number, hcr, updated_at, updated_by, organization_name, role) 
        //       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TIMESTAMPDIFF(YEAR, dob, CURDATE()), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`;
              
             
        //       con.query(sql, [profileBase64, name, id_number, password, address, gender, state, pincode, classes, division, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, currentBase64, pastBase64, mobile_number, hcr, updated_by, organization_name, role],
        //         function (err, result) {
        //           if (err) {
        //             console.error('Error executing SQL query:', err);
        //             return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
        //           }
                  
        //           console.log("1 record inserted");
        //           res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
        //         });
        //     });
        
        //   } catch (ex) {
        //     console.error('Error:', ex);
        //     res.status(500).json({ Result: "Failure", message: ex.message });
        //   }
        // });

         //insert without token
app.post('/staffdetails', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    // Extract other necessary data from req.body
    const { name, id_number, password, address, gender, state, pincode, classes, division, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, mobile_number, hcr, updated_by, organization_name } = req.body;

    const { profile, current_health_report, past_health_report } = req.body;
    let updatedPincode = (pincode == '' || pincode == null) ? null : pincode;
    const profileBase64 = profile == null ? null : convertImageToBase64(profile, "png");
    const currentBase64 = current_health_report == null ? null : convertImageToBase64(current_health_report, "png");
    const pastBase64 = past_health_report == null ? null : convertImageToBase64(past_health_report, "png");

    let role = hcr == 1 ? "hcr" : "staff";

    con.connect(function (err) {
      if (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
      }

      console.log("Connected to database!");
      var sql = `INSERT INTO tblstaff (profile, name, id_number, password, address, gender, state, pincode, classes, division, dob, age, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report, mobile_number, hcr, updated_at, updated_by, organization_name, role) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TIMESTAMPDIFF(YEAR, dob, CURDATE()), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`;

      con.query(sql, [profileBase64, name, id_number, password, address, gender, state, updatedPincode, classes, division, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, currentBase64, pastBase64, mobile_number, hcr, updated_by, organization_name, role],
        function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
          }

          console.log("1 record inserted");
          res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
        });
    });

  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});
        
        //with token for staffdetails
// app.post('/staffdetails', (req, res) => {
//   res.header('Content-Type', 'application/json');

//   try {
//     if (!req.headers.authorization) {
//       throw new Error('Authorization header is missing in the request.');
//     }

//     // Extract the token from the Authorization header
//     const token = req.headers.authorization.split(' ')[1]; 
//     if (!token) {
//       throw new Error('Token is missing in the Authorization header.');
//     }

//     // Verify the token with your secret key
//     const decodedToken = jwt.verify(token, '605001');
//     const organization_name = decodedToken.organization_name;

//     const { name, id_number, password, address, gender, state, pincode, classes, division, age, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, mobile_number, hcr, updated_by } = req.body;

//     const { profile, current_health_report, past_health_report } = req.body;
  
//     // // Check if these properties exist in req.body
//     // if (!profile || !current_health_report || !past_health_report) {
//     //   throw new Error('Required properties are missing in the request body.');
//     // }

//     var profileBase64 = convertImageToBase64(profile, "png");
//     var currentBase64 = convertImageToBase64(current_health_report, "png");
//       var pastBase64 = convertImageToBase64(past_health_report, "png");

//       let role = hcr == 1 ? "hcr" : "staff";

//     con.connect(function (err) {
//       if (err) {
//         console.error('Error connecting to database:', err);
//         return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
//       }
      
//       console.log("Connected to database!");
//       var sql = `INSERT INTO tblstaff (profile, name, id_number, password, address, gender, state, pincode, classes, division, age, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report, mobile_number, hcr, updated_at, updated_by,organization_name,role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?,?,?)`;
      
//       con.query(sql, [profileBase64, name, id_number, password, address, gender, state, pincode, classes, division, age, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, currentBase64, pastBase64, mobile_number, hcr, updated_by,organization_name,role],
//         function (err, result) {
//           if (err) {
//             console.error('Error executing SQL query:', err);
//             return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
//           }
          
//           console.log("1 record inserted");
//           res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
//         });
//     });

//   } catch (ex) {
//     console.error('Error:', ex);
//     res.status(500).json({ Result: "Failure", message: ex.message });
//   }
// });



// app.get('/get_staffprofile_by_id', (req, res) => {
//   const idNumber = req.body.id;
  
//   // Get a connection from the pool
//   con.connect(function(err) {
//       if (err) {
//           console.error('Error connecting to database:', err);
//           res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//           return;
//       }
//       console.log("Connected!");  
//       // Use placeholders in the SQL query to prevent SQL injection
//       const sql = `
//       SELECT 
//       d.from_time,
//             d.to_time,
//       d.assignee,
//       d.consult_id,
//       d.sick_type,
//       d.date,
//       d.id_number as hcr_id,
//       c.hcr_name,
//       st.designation,
//       st.updated_at,
//       st.profile,
//       st.current_health_report,
//       st.past_health_report,
//       st.name,
//       st.id_number,
//       st.address,
//       st.allergies_define,
//       st.any_disease_define,
//       CONCAT(st.classes, ' - ', st.division) AS class_and_division,
//       st.blood_group,
//       st.gender,
//       DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),st.dob)), '%Y') + 0 AS age,
//       st.mobile_number
//   FROM 
//       tblclasses c
//   inner JOIN 
//       tblstaff st
//       inner join
//        tblconsulting d where c.division = st.division and c.classes_name = st.classes and  
//        st.id_number = d.id_number
//   and st.id = ? `;
  
//       // Use parameterized query to avoid SQL injection
//       con.query(sql, [idNumber], function (err, result) {
//           if (err) {
//               console.error('Error executing SQL query:', err);
//               res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//           } else {
//               if (result.length > 0) {
//                   console.log(`${result.length} records fetched`);
//                   res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", data: result });
//               } else {
//                   res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//               }
//           }
//       });
//   });
//   });

app.get('/get_staffprofile_by_id', async (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    const { id_number } = req.query;
    // Get a connection from the pool
    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT     
      id,
      designation,
      department,
      updated_at,
      profile,
      current_health_report,
      past_health_report,
      name,
      id_number,
      address,
      allergies_define,
      any_disease_define,
      classes,
      division,
      blood_group,
      gender,
      dob,
      mobile_number,
      allergies,
      any_disease,
      hcr
  FROM 
      tblstaff
  where id_number = ?`;
      con.query(sql, [id_number], function (err, result) {
        if (err) throw err;
        console.log("1 record shown");
        console.log('Result of staff Query ', result.length, '     ', result);
        if (result.length > 0) {
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        } else {
          res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
        }
      });
    });

  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

//--- 

app.get('/viewallstaff', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    // Get a connection from the pool
    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT id,profile, name, designation, CASE WHEN hcr = 1 THEN 'yes' ELSE 'no' END AS hcr, mobile_number, updated_at FROM tblstaff where (is_deleted = 0 OR is_deleted IS NULL)`;
      con.query(sql, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
          console.log("1 record inserted");
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        } else {
          res.status(404).json({ Result: "Failure", message: "No records found" });
        }
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});



//   app.get('/get_staffprofile_by_id', (req, res) => {
//     const idNumber = req.body.id_number;
    
//     // Get a connection from the pool
//     con.connect(function(err) {
//         if (err) {
//             console.error('Error connecting to database:', err);
//             res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//             return;
//         }
//         console.log("Connected!");  
//         // Use placeholders in the SQL query to prevent SQL injection
//         const sql = `
//         SELECT 
//         st.designation,
//             st.name,
//             st.profile,
//             st.id_number,
//             st.department,
//             DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),st.dob)), '%Y') + 0 AS age,
//             st.gender,
//             st.blood_group,
//             st.address,
//             st.mobile_number,
//             st.allergies_define,
//             st.any_disease_define,
//             st.current_health_report,
//             st.past_health_report,
//             d.sick_type,
//             d.consult_id,
//             CONCAT(st.classes, '/', st.division) AS class_and_division,
//             d.id_number AS consult_id_number,
//             d.id_number AS hcr_id,
//             d.assignee,
//             d.hcr_name,
//             CONCAT(d.from_time, ' - ', d.to_time) AS time,
//             DATE_FORMAT(d.date, '%b %e,%Y') AS formatted_date
            
//         FROM 
//             tblstaff st
//         LEFT JOIN 
//             tblconsulting d ON st.id_number = d.id_number
//         WHERE 
//             st.id_number = ? `;
        
//         // Use parameterized query to avoid SQL injection
//         con.query(sql, [idNumber], function (err, result) {
//             if (err) {
//                 console.error('Error executing SQL query:', err);
//                 res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//             } else {
//                 if (result.length > 0) {
//                     console.log(`${result.length} records fetched`);
//                     // Organizing data into separate arrays
//                     const firstArray = result.map(item => ({ 
//                       name: item.name, 
//                       profile: item.profile,
//                        id_number: item.id_number,
//                         designation: item.designation}));
//                     const secondArray = result.map(item => ({
//                         name: item.name,
//                         department: item.department,
//                         age: item.age,
//                         gender: item.gender,
//                         blood_group: item.blood_group,
//                         class_and_division: item.class_and_division,
//                         address: item.address,
//                         mobile_number: item.mobile_number,
//                         allergies_define: item.allergies_define,
//                         any_disease_define: item.any_disease_define,
//                         current_health_report: item.current_health_report,
//                         past_health_report: item.past_health_report
//                     }));
//                     const thirdArray = result.map(item => ({
//                         name: item.name,
//                         sick_type: item.sick_type,
//                         consult_id: item.consult_id,
//                         class_and_division: item.class_and_division,
//                         id_number: item.id_number,
//                         hcr_id: item.hcr_id,
//                         assignee: item.assignee,
//                         hcr_name: item.hcr_name,
//                         time: item.time,
//                         date: item.formatted_date,
//                         mobile_number: item.mobile_number
//                     }));
//                     res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", firstArray, secondArray, thirdArray });
//                 } else {
//                     res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//                 }
//             }
//         });
//     });
// });
//------------

// app.get('/consulting_staffprofile_by_id', (req, res) => {
//   const idNumber = req.body.id_number;
  
//   // Get a connection from the pool
//   con.connect(function(err) {
//       if (err) {
//           console.error('Error connecting to database:', err);
//           res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//           return;
//       }
//       console.log("Connected!");  
//       // Use placeholders in the SQL query to prevent SQL injection
//       const sql = `
//       SELECT 
//           st.designation,
//           st.name,
//           st.profile,
//           st.id_number,
//           st.department,
//           DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),st.dob)), '%Y') + 0 AS age,
//           st.gender,
//           st.blood_group,
//           st.address,
//           st.mobile_number,
//           st.allergies_define,
//           st.any_disease_define,
//           st.current_health_report,
//           st.past_health_report,
//           d.sick_type,
//           d.consult_id,
//           CONCAT(st.classes, '/', st.division) AS class_and_division,
//           d.id_number AS consult_id_number,
//           d.id_number AS hcr_id,
//           d.assignee,
//           d.hcr_name,
//           CONCAT(d.from_time, ' - ', d.to_time) AS time,
//           DATE_FORMAT(d.date, '%b %e,%Y') AS formatted_date
          
//       FROM 
//           tblstaff st
//       LEFT JOIN 
//           tblconsulting d ON st.id_number = d.id_number
//       WHERE 
//           st.id_number = ? `;
      
//       // Use parameterized query to avoid SQL injection
//       con.query(sql, [idNumber], function (err, result) {
//           if (err) {
//               console.error('Error executing SQL query:', err);
//               res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//               return;
//           } 
//           if (result.length > 0) {
//               console.log(`${result.length} records fetched`);
              
//               // Organizing data into separate arrays
//               const firstArray = [];
//               const secondArray = [];
//               let j = 0;
//               for (let i = 0; i < result.length; i++) {
//                   const item = result[i];
//                   j = i + 1;
                
//                   if(result.length == 1) {
//                       // Push data to firstArray
//                       firstArray.push({
//                           name: item.name, 
//                           profile: item.profile,
//                           id_number: item.id_number,
//                           designation: item.designation
//                       });
//                       continue;
//                   }
//                   if(result.length > 1 && j < result.length) {
//                       console.log(result[i].id_number,'    ',result[j].id_number);
//                       if (i == 0) { 
//                           firstArray.push({
//                               name: item.name, 
//                               profile: item.profile,
//                               id_number: item.id_number,
//                               designation: item.designation
//                           });
//                           continue;
//                       } else {
//                           if (result[i].id_number != result[j].id_number) {
//                               firstArray.push({
//                                   name: item.name, 
//                                   profile: item.profile,
//                                   id_number: item.id_number,
//                                   designation: item.designation
//                               });
//                           }
//                       }
//                   }
//               }

//               //secondArray loop

//               // Push data to secondArray
//               let k = 0;
//               for (let m = 0; m < result.length; m++) {
//                   const item = result[m];
//                   k = m + 1;
                
//                   if(result.length == 1) {
//                       // Push data to firstArray
//                       secondArray.push({
//                           name: item.name,
//                           department: item.department,
//                           age: item.age,
//                           gender: item.gender,
//                           blood_group: item.blood_group,
//                           class_and_division: item.class_and_division,
//                           address: item.address,
//                           mobile_number: item.mobile_number,
//                           allergies_define: item.allergies_define,
//                           any_disease_define: item.any_disease_define,
//                           current_health_report: item.current_health_report,
//                           past_health_report: item.past_health_report
//                       });
//                       continue;
//                   }
//                   if(result.length > 1 && k < result.length) {
//                       console.log(result[m].id_number,'    ',result[k].id_number);
//                       if (m == 0) { 
//                           secondArray.push({
//                               name: item.name,
//                               department: item.department,
//                               age: item.age,
//                               gender: item.gender,
//                               blood_group: item.blood_group,
//                               class_and_division: item.class_and_division,
//                               address: item.address,
//                               mobile_number: item.mobile_number,
//                               allergies_define: item.allergies_define,
//                               any_disease_define: item.any_disease_define,
//                               current_health_report: item.current_health_report,
//                               past_health_report: item.past_health_report
//                           });
//                           continue;
//                       } else {
//                           if (result[m].id_number != result[k].id_number) {
//                               secondArray.push({
//                                   name: item.name,
//                                   department: item.department,
//                                   age: item.age,
//                                   gender: item.gender,
//                                   blood_group: item.blood_group,
//                                   class_and_division: item.class_and_division,
//                                   address: item.address,
//                                   mobile_number: item.mobile_number,
//                                   allergies_define: item.allergies_define,
//                                   any_disease_define: item.any_disease_define,
//                                   current_health_report: item.current_health_report,
//                                   past_health_report: item.past_health_report
//                               });
//                           }
//                       }
//                   }
//               }

//               // Organizing data into thirdArray (outside the loop)
//               const consultingArray = result.map(item => ({
//                   name: item.name,
//                   sick_type: item.sick_type,
//                   consult_id: item.consult_id,
//                   class_and_division: item.class_and_division,
//                   id_number: item.id_number,
//                   hcr_id: item.hcr_id,
//                   assignee: item.assignee,
//                   hcr_name: item.hcr_name,
//                   time: item.time,
//                   date: item.formatted_date,
//                   mobile_number: item.mobile_number
//               }));

//               res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", firstArray, secondArray, consultingArray });
//           } else {
//               res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//           }
//       });
//   });
// });

app.get('/consulting_staffprofile_by_id', (req, res) => {
  const idNumber = req.query.id_number;
  
  // Get a connection from the pool
  con.connect(function(err) {
      if (err) {
          console.error('Error connecting to database:', err);
          res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
          return;
      }
      console.log("Connected!");  
      // Use placeholders in the SQL query to prevent SQL injection
      const sql = `
      SELECT 
          st.designation,
          st.name,
          st.profile,
          st.id_number,
          st.department,
          DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),st.dob)), '%Y') + 0 AS age,
          st.gender,
          st.blood_group,
          st.address,
          st.mobile_number,
          st.allergies_define,
          st.any_disease_define,
          st.current_health_report,
          st.past_health_report,
          d.sick_type,
          d.consult_id,
          CONCAT(st.classes, '/', st.division) AS class_and_division,
          d.id_number ,
          d.id_number AS hcr_id,
          d.assignee,
          d.hcr_name,
          CONCAT(d.from_time, ' - ', d.to_time) AS time,
          DATE_FORMAT(d.date, '%b %e,%Y') AS formatted_date_time
          
      FROM 
          tblstaff st
      LEFT JOIN 
          tblconsulting d ON st.id_number = d.id_number
      WHERE 
          st.id_number = ? `;
      
      // Use parameterized query to avoid SQL injection
      con.query(sql, [idNumber], function (err, result) {
          if (err) {
              console.error('Error executing SQL query:', err);
              res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
              return;
          } 
          if (result.length > 0) {
              console.log(`${result.length} records fetched`);
              
              // Organizing data into separate arrays
              const firstArray = [];
              const secondArray = [];
              let j = 0;
              for (let i = 0; i < result.length; i++) {
                  const item = result[i];
                  j = i + 1;
                
                  if(result.length == 1) {
                      // Push data to firstArray
                      firstArray.push({
                          name: item.name, 
                          profile: item.profile,
                          id_number: item.id_number,
                          designation: item.designation
                      });
                      continue;
                  }
                  if(result.length > 1 && j < result.length) {
                      console.log(result[i].id_number,'    ',result[j].id_number);
                      if (i == 0) { 
                          firstArray.push({
                              name: item.name, 
                              profile: item.profile,
                              id_number: item.id_number,
                              designation: item.designation
                          });
                          continue;
                      } else {
                          if (result[i].id_number != result[j].id_number) {
                              firstArray.push({
                                  name: item.name, 
                                  profile: item.profile,
                                  id_number: item.id_number,
                                  designation: item.designation
                              });
                          }
                      }
                  }
              }

              //secondArray loop

              // Push data to secondArray
              let k = 0;
              for (let m = 0; m < result.length; m++) {
                  const item = result[m];
                  k = m + 1;
                
                  if(result.length == 1) {
                      // Push data to firstArray
                      secondArray.push({
                          name: item.name,
                          department: item.department,
                          age: item.age,
                          gender: item.gender,
                          blood_group: item.blood_group,
                          class_and_division: item.class_and_division,
                          address: item.address,
                          mobile_number: item.mobile_number,
                          allergies_define: item.allergies_define,
                          any_disease_define: item.any_disease_define,
                          current_health_report: item.current_health_report,
                          past_health_report: item.past_health_report
                      });
                      continue;
                  }
                  if(result.length > 1 && k < result.length) {
                      console.log(result[m].id_number,'    ',result[k].id_number);
                      if (m == 0) { 
                          secondArray.push({
                              name: item.name,
                              department: item.department,
                              age: item.age,
                              gender: item.gender,
                              blood_group: item.blood_group,
                              class_and_division: item.class_and_division,
                              address: item.address,
                              mobile_number: item.mobile_number,
                              allergies_define: item.allergies_define,
                              any_disease_define: item.any_disease_define,
                              current_health_report: item.current_health_report,
                              past_health_report: item.past_health_report
                          });
                          continue;
                      } else {
                          if (result[m].id_number != result[k].id_number) {
                              secondArray.push({
                                  name: item.name,
                                  department: item.department,
                                  age: item.age,
                                  gender: item.gender,
                                  blood_group: item.blood_group,
                                  class_and_division: item.class_and_division,
                                  address: item.address,
                                  mobile_number: item.mobile_number,
                                  allergies_define: item.allergies_define,
                                  any_disease_define: item.any_disease_define,
                                  current_health_report: item.current_health_report,
                                  past_health_report: item.past_health_report
                              });
                          }
                      }
                  }
              }

              // Organizing data into consultingArray (outside the loop)
              const consultingArray = result.map(item => ({
                  name: item.name,
                  sick_type: item.sick_type,
                  consult_id: item.consult_id,
                  class_and_division: item.class_and_division,
                  id_number: item.id_number,
                  hcr_id: item.hcr_id,
                  assignee: item.assignee,
                  hcr_name: item.hcr_name,
                  time: item.time,
                  date_time: item.formatted_date_time,
                  mobile_number: item.mobile_number
              }));

              res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", firstArray, secondArray, consultingArray });
          } else {
              res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
          }
      });
  });
});

app.get('/staffviewediting_profilebyid', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id} = req.query.id;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tblstaff WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record view :" + JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
     console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  } 
  
 });

 app.put('/updatestaff', (req, res) => {
  // Set the content type header to JSON
  res.header('Content-Type', 'application/json');

  try {
    
    // Destructure the request body
    const { name, password, address, gender, state, pincode, classes, division, age, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, mobile_number, hcr, updated_by, id_number } = req.body;

    const { profile, current_health_report, past_health_report } = req.body;


    // Convert any relevant data to base64 format if needed
    const profileBase64 = profile== null? null: convertImageToBase64(profile, "png");
    const currentBase64 = current_health_report== null? null:convertImageToBase64(current_health_report, "png");
    const pastBase64 = past_health_report== null? null:convertImageToBase64(past_health_report, "png");

    let role = hcr == 1 ? "hcr" : "staff";

    // Establish database connection
    con.connect(function (err) {
      if (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
      }
      
      console.log("Connected to database!");
      // Define the SQL query
      var sql = `UPDATE tblstaff SET profile=?, name=?, password=?, address=?, gender=?, state=?, pincode=?, classes=?, division=?, age=?, dob=?, blood_group=?, designation=?, department=?, allergies=?, allergies_define=?, any_disease=?, any_disease_define=?, current_health_report=?, past_health_report=?, mobile_number=?, hcr=?, doc=NOW(), updated_at=CURRENT_TIMESTAMP(), updated_by=?,  organization_name=?,role=?  WHERE id_number=?`;
      
      // Execute the SQL query
      con.query(sql, [profileBase64, name, password, address, gender, state, pincode, classes, division, age, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, currentBase64, pastBase64, mobile_number, hcr, updated_by, organization_name,role, id_number],
        function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
          }
          
          console.log("1 record updated");
          res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        });
    });

  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

  // app.put('/updatestaff', (req, res) => {
  //   // Set the content type header to JSON
  //   res.header('Content-Type', 'application/json');
  
  //   try {  
  //     // Destructure the request body
  //     const { name, id_number, password, address, gender, state, pincode, classes, division, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, mobile_number, hcr, updated_by, organization_name,id } = req.body;

  //     const { profile, current_health_report, past_health_report } = req.body;
  
  
  //     // Convert any relevant data to base64 format if needed
  //     const profileBase64 = profile== null? null: convertImageToBase64(profile, "png");
  //     const currentBase64 = current_health_report== null? null:convertImageToBase64(current_health_report, "png");
  //     const pastBase64 = past_health_report== null? null:convertImageToBase64(past_health_report, "png");

  //     let role = hcr == 1 ? "hcr" : "staff";
  
  //     // Establish database connection
  //     con.connect(function (err) {
  //       if (err) {
  //         console.error('Error connecting to database:', err);
  //         return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
  //       }
        
  //       console.log("Connected to database!");
  //       // Define the SQL query
  //       var sql = `UPDATE tblstaff SET profile=?, name=?, id_number=?, password=?, address=?, gender=?, state=?, pincode=?, classes=?, division=?, age=TIMESTAMPDIFF(YEAR, dob, CURDATE()), dob=?, blood_group=?, designation=?, department=?, allergies=?, allergies_define=?, any_disease=?, any_disease_define=?, current_health_report=?, past_health_report=?, mobile_number=?, hcr=?, doc=NOW(), updated_at=CURRENT_TIMESTAMP(), updated_by=?,  organization_name=?,role=?  WHERE id=?`;
        
  //       // Execute the SQL query
  //       con.query(sql, [profileBase64, name, id_number, password, address, gender, state, pincode, classes, division, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, currentBase64, pastBase64, mobile_number, hcr, updated_by, organization_name,role,id],
  //         function (err, result) {
  //           if (err) {
  //             console.error('Error executing SQL query:', err);
  //             return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
  //           }
            
  //           console.log("1 record updated");
  //           res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
  //         });
  //     });
  
  //   } catch (ex) {
  //     console.error('Error:', ex);
  //     res.status(500).json({ Result: "Failure", message: ex.message });
  //   }
  // });
  

// app.get('/staffbyid', (req, res)=>{
//   res.header('Content-Type', 'application/json');
//   try {
//     const {id_number}  = req.body;
//     // Get a connection from the pool
//     con.connect(function(err) {
//       if (err) throw err;
//       console.log("Connected!");
//       var sql = `SELECT * FROM tblstaff WHERE id_number =?`;
//         con.query(sql, [id_number], function (err, result) {
//         if (err) throw err;
//         console.log("1 record shown");
//         res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
//       });
//     });

//   } catch   (ex) {
//     console.error('Error:', ex);
//     res.status(500).json({ Result: "Failure", message: ex.message });
//   }
// });

//-------------

  

  // app.get('/get_designationname', (req, res) => {       //gives multiple array values
  //   res.header('Content-Type', 'application/json');
  //   try{
  //     con.connect(function(err) {
  //       if (err) throw err;
  //       console.log("Connected!");
  //       var sql = `SELECT designation_role FROM tbldesignation`;
  //       con.query(sql, function (err, result) {
  //         if (err) throw err;
  //         console.log("record view");
  //         res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
  //       });
  //     });


  //   } catch (err) {
  //     console.error('Error:', err);
  //     res.status(500).json({ Result: "Failure", message: err.message });
  //   }  
  // });

  
  

//                                      Student and parent details
  
//without token
  app.post('/insert_student_and_parent_submit', (req, res) => {
    res.header('Content-Type', 'application/json');
  
    try {
      
  
      const {
        name, id_number, address, gender, state, pincode, classes, division, dob,
        blood_group, allergies, allergies_define, any_disease, any_disease_define,
        parent_name, relation, mobile_number, doc,organization_name,role, department
      } = req.body;
  
      // Ensure profile, current_health_report, and past_health_report exist in req.body
      const { profile, current_health_report, past_health_report } = req.body;
  
      // Check if these properties exist in req.body
      if (!profile || !current_health_report || !past_health_report) {
        throw new Error('Required properties are missing in the request body.');
      }
  
      // Convert document and image to base64
      const profileBase64 = profile == null ? null : convertImageToBase64(profile, "png");
      const currentBase64 = current_health_report == null ? null : convertImageToBase64(current_health_report, "png");
      const pastBase64 = past_health_report == null ? null : convertImageToBase64(past_health_report, "png");
  
      // Begin transaction
      con.beginTransaction(function (err) {
        if (err) {
          throw err;
        }
  
        // Insert into tblstudent
        const insertStudentQuery = `
          INSERT INTO tblstudent( profile, name, id_number, address, gender, state, pincode, classes, division, dob, blood_group, allergies, allergies_define, any_disease, any_disease_define, current_health_report,
    past_health_report, doc,organization_name,role,department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,NOW(),?,?,?)
        `;
        con.query(
          insertStudentQuery,
          [
            profileBase64, name, id_number, address, gender, state, pincode, classes, division, dob,
            blood_group, allergies, allergies_define, any_disease, any_disease_define, currentBase64,
            pastBase64, organization_name, 'student',department
          ],
          function (err, studentResult) {
            if (err) {
              // Rollback the transaction if there is an error
              return con.rollback(function () {
                throw err;
              });
            }
  
            // Insert into tblparent
            const insertParentQuery = `
              INSERT INTO tblparent (id_number, parent_name, relation, mobile_number)
              VALUES (?, ?, ?, ?)
            `;
  
            con.query(
              insertParentQuery,
              [id_number, parent_name, relation, mobile_number],
              function (err, parentResult) {
                if (err) {
                  // Rollback the transaction if there is an error
                  return con.rollback(function () {
                    throw err;
                  });
                }
  
                // Commit the transaction if both inserts are successful
                con.commit(function (err) {
                  if (err) {
                    // Rollback the transaction if there is an error
                    return con.rollback(function () {
                      throw err;
                    });
                  }
  
                  console.log("Both records inserted");
                  console.log(studentResult);
                  console.log(parentResult);
  
                  res.status(200).json({
                    Result: "Success",
                    message: "Both records inserted successfully",
                    studentResult,
                    parentResult
                  });
                });
              }
            );
          }
        );
      });
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({
        Result: "Failure",
        message: ex.message
      });
    }
  });
            //insert / add student with token
  // app.post('/insert_student_and_parent_submit', (req, res) => {
  //   res.header('Content-Type', 'application/json');
  
  //   try {
  //     // Ensure that the Authorization header is present in the request
  //     if (!req.headers.authorization) {
  //       throw new Error('Authorization header is missing in the request.');
  //     }
  
  //     // Extract the token from the Authorization header
  //     const token = req.headers.authorization.split(' ')[1]; 
  //     if (!token) {
  //       throw new Error('Token is missing in the Authorization header.');
  //     }
  
  //     // Verify the token with your secret key
  //     const decodedToken = jwt.verify(token, '605001');
  //     const organization_name = decodedToken.organization_name;
  
  //     const {
  //       name, id_number, address, gender, state, pincode, classes, division, dob,
  //       blood_group, allergies, allergies_define, any_disease, any_disease_define,
  //       parent_name, relation, mobile_number, doc,role, department
  //     } = req.body;
  
  //     // Ensure profile, current_health_report, and past_health_report exist in req.body
  //     const { profile, current_health_report, past_health_report } = req.body;
  
  //     // Check if these properties exist in req.body
  //     if (!profile || !current_health_report || !past_health_report) {
  //       throw new Error('Required properties are missing in the request body.');
  //     }
  
  //     // Convert document and image to base64
  //     var profileBase64 = convertImageToBase64(profile, "png");
  //     var currentBase64 = convertImageToBase64(current_health_report, "png");
  //     var pastBase64 = convertImageToBase64(past_health_report, "png");
  
  //     // Begin transaction
  //     con.beginTransaction(function (err) {
  //       if (err) {
  //         throw err;
  //       }
  
  //       // Insert into tblstudent
  //       const insertStudentQuery = `
  //         INSERT INTO tblstudent( profile, name, id_number, address, gender, state, pincode, classes, division, dob, blood_group, allergies, allergies_define, any_disease, any_disease_define, current_health_report,
  //   past_health_report, doc,organization_name,role,department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,NOW(),?,?,?)
  //       `;
  //       con.query(
  //         insertStudentQuery,
  //         [
  //           profileBase64, name, id_number, address, gender, state, pincode, classes, division, dob,
  //           blood_group, allergies, allergies_define, any_disease, any_disease_define, currentBase64,
  //           pastBase64, organization_name, 'student',department
  //         ],
  //         function (err, studentResult) {
  //           if (err) {
  //             // Rollback the transaction if there is an error
  //             return con.rollback(function () {
  //               throw err;
  //             });
  //           }
  
  //           // Insert into tblparent
  //           const insertParentQuery = `
  //             INSERT INTO tblparent (id_number, parent_name, relation, mobile_number)
  //             VALUES (?, ?, ?, ?)
  //           `;
  
  //           con.query(
  //             insertParentQuery,
  //             [id_number, parent_name, relation, mobile_number],
  //             function (err, parentResult) {
  //               if (err) {
  //                 // Rollback the transaction if there is an error
  //                 return con.rollback(function () {
  //                   throw err;
  //                 });
  //               }
  
  //               // Commit the transaction if both inserts are successful
  //               con.commit(function (err) {
  //                 if (err) {
  //                   // Rollback the transaction if there is an error
  //                   return con.rollback(function () {
  //                     throw err;
  //                   });
  //                 }
  
  //                 console.log("Both records inserted");
  //                 console.log(studentResult);
  //                 console.log(parentResult);
  
  //                 res.status(200).json({
  //                   Result: "Success",
  //                   message: "Both records inserted successfully",
  //                   studentResult,
  //                   parentResult
  //                 });
  //               });
  //             }
  //           );
  //         }
  //       );
  //     });
  //   } catch (ex) {
  //     console.error('Error:', ex);
  //     res.status(500).json({
  //       Result: "Failure",
  //       message: ex.message
  //     });
  //   }
  // });

  //----------------------------------------------------------------
//show student profile details
// app.get('/get_student_and_parent_by_id', (req, res) => {
// const idNumber = req.body.id_number;

// // Get a connection from the pool
// con.connect(function(err) {
//     if (err) {
//         console.error('Error connecting to database:', err);
//         res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//         return;
//     }

//     console.log("Connected!");

//     // Use placeholders in the SQL query to prevent SQL injection
//     const sql = `
//     SELECT           
//             p.mobile_number,
//             p.parent_number,
//             p.relation,
//             s.profile,
//             s.name,
//             s.profile,
//             s.department,
//             s.allergies,
//             s.any_disease
//             s.id_number,
//             s.address,
//             s.allergies_define,
//             s.any_disease_define,
//             s.current_health_report,
//             s.past_health_report,
//             s.organization_name,
//             s.state,
//             s.pincode,
//             s.role,
//             s.classes,
//             s.division
//             s.blood_group,
//             s.gender,
//             s.dob,
//             DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),s.dob)), '%Y') + 0 AS age
//         FROM 
//              tblparent p
//         inner join
//             tblstudent s  
// 		 p.id_number = s.id_number   and  s.id_number=?`;

//     // Use parameterized query to avoid SQL injection
//     con.query(sql, [idNumber], function (err, result) {
//         if (err) {
//             console.error('Error executing SQL query:', err);
//             res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//         } else {
//             if (result.length > 0) {
//                 console.log(`${result.length} records fetched`);
//                 res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", data: result });
//             } else {
//                 res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//             }
//         }
//     });
// });
// });

        //

// app.get('/get_student_and_parent_by_id', (req, res) => {
//   res.header('Content-Type', 'application/json');
//   try{
//     const{id_number} = req.body;
//     con.connect(function(err) {
//       if (err) throw err;
//       console.log("Connected!");
//       var sql = `
//       SELECT           
//     p.mobile_number,
//     p.parent_name,
//     p.relation,
//     s.profile,
//     s.name,
//     s.department,
//     s.allergies,
//     s.any_disease,
//     s.id_number,
//     s.address,
//     s.allergies_define,
//     s.any_disease_define,
//     s.current_health_report,
//     s.past_health_report,
//     s.organization_name,
//     s.state,
//     s.pincode,
//     s.role,
//     s.classes,
//     s.division,
//     s.blood_group,
//     s.gender,
//     s.dob,
//     DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), s.dob)), '%Y') + 0 AS age
// FROM 
//     tblparent p
// INNER JOIN
//     tblstudent s ON p.id_number = s.id_number
// WHERE 
//     s.id_number = ?`;
//       con.query(sql, [id_number], function (err, result) {
//         if (err) throw err;
//         console.log("record view :" + JSON.stringify(result));
//         res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
//       });
//     });
//   } catch (err) {
//      console.error('Error:', err);
//     res.status(500).json({ Result: "Failure", message: err.message });
//   } 
  
//  });

app.get('/consulting_studentprofile_by_id', (req, res) => { 
  const idNumber = req.query.id_number; 
   
  // Get a connection from the pool 
  con.connect(function(err) { 
      if (err) { 
          console.error('Error connecting to database:', err); 
          res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" }); 
          return; 
      } 
      console.log("Connected!");   
      // Use placeholders in the SQL query to prevent SQL injection 
      const sql = ` 
      SELECT  
      d.assignee, 
      d.consult_id, 
      d.sick_type, 
      DATE_FORMAT(d.date, '%b %e,%Y') AS formatted_date, 
      stf.id_number as staff_id_number, 
      c.hcr_name,             
      hp.mobile_number, 
       hp.parent_name, 
      s.profile, 
      s.name, 
      s.id_number, 
      s.address, 
      s.allergies_define, 
      s.any_disease_define, 
      CONCAT(s.classes, '/', s.division) AS class_and_division, 
      CONCAT(d.from_time, ' - ', d.to_time) AS time, 
      s.blood_group, 
      s.gender, 
      DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),s.dob)), '%Y') + 0 AS age 
  FROM  
       tblparent hp inner join  
       tblclasses c 
  inner join 
      tblstudent s inner join tblconsulting d  
  inner join tblstaff stf where  s.id_number = hp.id_number and c.division = s.division and 
c.classes_name = s.classes and d.id_number = s.id_number and stf.name = c.hcr_name  and  
s.id_number=?`; 
       
      // Use parameterized query to avoid SQL injection 
      con.query(sql, [idNumber], function (err, result) { 
          if (err) { 
              console.error('Error executing SQL query:', err); 
              res.status(500).json({ Result: "Failure", message: "Failed to fetch data" }); 
              return; 
          }  
          if (result.length > 0) { 
              console.log(`${result.length} records fetched`); 
               
              // Organizing data into separate arrays 
              const firstArray = []; 
              const secondArray = []; 
              let j = 0; 
              for (let i = 0; i < result.length; i++) { 
                  const item = result[i]; 
                  j = i + 1; 
                 
                  if(result.length == 1) { 
                      // Push data to firstArray 
                      firstArray.push({ 
                        name: item.name, 
                        profile: item.profile, 
                        id_number: item.id_number 
                    }); 
                      continue; 
                  } 
                  if(result.length > 1 && j < result.length) { 
                      console.log(result[i].id_number,'    ',result[j].id_number); 
                      if (i == 0) {  
                        firstArray.push({ 
                          name: item.name, 
                          profile: item.profile, 
                          id_number: item.id_number 
                      }); 
                          continue; 
                      } else { 
                          if (result[i].id_number != result[j].id_number) { 
                            firstArray.push({ 
                              name: item.name, 
                              profile: item.profile, 
                              id_number: item.id_number 
                          }); 
                          } 
                      } 
                  } 
              } 
           
              // Push data to secondArray 
              let k = 0; 
              for (let m = 0; m < result.length; m++) { 
                  const item = result[m]; 
                  k = m + 1; 
                 
                  if(result.length == 1) { 
                      // Push data to firstArray 
                      secondArray.push({ 
                        name: item.name, 
                        sick_type: item.sick_type, 
                        department: item.hcr_name, 
                        age: item.age, 
                        gender: item.gender, 
                        blood_group: item.blood_group, 
                        class_and_division: item.class_and_division, 
                        address: item.address, 
                        mobile_number: item.mobile_number, 
                        parent_name: item.parent_name, 
                        allergies_define: item.allergies_define, 
                        any_disease_define: item.any_disease_define, 
                        current_health_report: item.current_health_report,  
                        past_health_report: item.past_health_report  
                    }); 
                      continue; 
                  } 
                  if(result.length > 1 && k < result.length) { 
                      console.log(result[m].id_number,'    ',result[k].id_number); 
                      if (m == 0) {  
                        secondArray.push({ 
                          name: item.name, 
                          sick_type: item.sick_type, 
                          department: item.hcr_name, 
                          age: item.age, 
                          gender: item.gender, 
                          blood_group: item.blood_group, 
                          class_and_division: item.class_and_division, 
                          address: item.address, 
                          mobile_number: item.mobile_number, 
                          parent_name: item.parent_name, 
                          allergies_define: item.allergies_define, 
                          any_disease_define: item.any_disease_define, 
                          current_health_report: item.current_health_report,  
                          past_health_report: item.past_health_report  
                      }); 
                          continue; 
                      } else { 
                          if (result[m].id_number != result[k].id_number) { 
                            secondArray.push({ 
                              name: item.name, 
                              sick_type: item.sick_type, 
                              department: item.hcr_name, 
                              age: item.age, 
                              gender: item.gender, 
                              blood_group: item.blood_group, 
                              class_and_division: item.class_and_division, 
                              address: item.address, 
                              mobile_number: item.mobile_number, 
                              parent_name: item.parent_name, 
                              allergies_define: item.allergies_define, 
                              any_disease_define: item.any_disease_define, 
                              current_health_report: item.current_health_report,  
                              past_health_report: item.past_health_report  
                          }); 
                          } 
                      } 
                  } 
              } 
 
              // Organizing data into thirdArray (outside the loop) 
              const consultingArray = result.map(item => ({ 
                name: item.name, 
                sick_type: item.sick_type, 
                consult_id: item.consult_id, 
                class_and_division: item.class_and_division, 
                id_number: item.id_number, 
                assignee: item.assignee, 
                hcr_name: item.hcr_name, 
                time: item.time, 
                date: item.formatted_date
            })); 
 
              res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", 
firstArray, secondArray, consultingArray }); 
          } else { 
              res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" }); 
          } 
      }); 
  }); 
}); 

// app.get('/consulting_studentprofile_by_id', (req, res) => {
//   const idNumber = req.body.id_number;

//   // Get a connection from the pool
//   con.connect(function(err) {
//     if (err) {
//       console.error('Error connecting to database:', err);
//       res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//       return;
//     }
//     console.log("Connected!");
//     // Use placeholders in the SQL query to prevent SQL injection
//     const sql = `
//       SELECT
//         d.assignee,
//         d.consult_id,
//         d.sick_type,
//         DATE_FORMAT(d.date, '%b %e,%Y') AS formatted_date,
//         stf.id_number as staff_id_number, 
//         c.hcr_name,
//         hp.mobile_number,
//         hp.parent_name,
//         s.profile,
//         s.name,
//         s.id_number,
//         s.address,
//         s.allergies_define,
//         s.any_disease_define,
//         CONCAT(s.classes, '/', s.division) AS class_and_division,
//         CONCAT(d.from_time, ' - ', d.to_time) AS time,
//         s.blood_group,
//         s.gender,
//         DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),s.dob)), '%Y') + 0 AS age
//       FROM
//         tblparent hp
//       INNER JOIN
//         tblclasses c ON c.division = s.division AND c.classes_name = s.classes
//       INNER JOIN
//         tblstudent s ON s.id_number = hp.id_number
//       INNER JOIN
//         tblconsulting d ON d.id_number = s.id_number
//       INNER JOIN
//         tblstaff stf ON stf.name = c.hcr_name
//       WHERE
//         s.id_number=?
//     `;

//     // Use parameterized query to avoid SQL injection
//     con.query(sql, [idNumber], function (err, result) {
//       if (err) {
//         console.error('Error executing SQL query:', err);
//         res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//         return;
//       }
//       if (result.length > 0) {
//         console.log(`${result.length} records fetched`);

//         // Organizing data into separate arrays
//         const firstArray = [];
//         const secondArray = [];
//         let j = 0;
//         for (let i = 0; i < result.length; i++) {
//           const item = result[i];
//           j = i + 1;

//           if(result.length == 1) {
//             // Push data to firstArray
//             firstArray.push({
//               name: item.name,
//               profile: item.profile,
//               id_number: item.id_number
//             });
//             continue;
//           }
//           if(result.length > 1 && j < result.length) {
//             console.log(result[i].id_number,'    ',result[j].id_number);
//             if (i == 0) {
//               firstArray.push({
//                 name: item.name,
//                 profile: item.profile,
//                 id_number: item.id_number
//               });
//               continue;
//             } else {
//               if (result[i].id_number != result[j].id_number) {
//                 firstArray.push({
//                   name: item.name,
//                   profile: item.profile,
//                   id_number: item.id_number
//                 });
//               }
//             }
//           }
//         }

//         // Push data to secondArray
//         let k = 0;
//         for (let m = 0; m < result.length; m++) {
//           const item = result[m];
//           k = m + 1;

//           if(result.length == 1) {
//             // Push data to firstArray
//             secondArray.push({
//               name: item.name,
//               sick_type: item.sick_type,
//               department: item.hcr_name,
//               age: item.age,
//               gender: item.gender,
//               blood_group: item.blood_group,
//               class_and_division: item.class_and_division,
//               address: item.address,
//               mobile_number: item.mobile_number,
//               parent_name: item.parent_name,
//               allergies_define: item.allergies_define,
//               any_disease_define: item.any_disease_define,
//               current_health_report: item.current_health_report,
//               past_health_report: item.past_health_report
//             });
//             continue;
//           }
//           if(result.length > 1 && k < result.length) {
//             console.log(result[m].id_number,'    ',result[k].id_number);
//             if (m == 0) {
//               secondArray.push({
//                 name: item.name,
//                 sick_type: item.sick_type,
//                 department: item.hcr_name,
//                 age: item.age,
//                 gender: item.gender,
//                 blood_group: item.blood_group,
//                 class_and_division: item.class_and_division,
//                 address: item.address,
//                 mobile_number: item.mobile_number,
//                 parent_name: item.parent_name,
//                 allergies_define: item.allergies_define,
//                 any_disease_define: item.any_disease_define,
//                 current_health_report: item.current_health_report,
//                 past_health_report: item.past_health_report
//               });
//               continue;
//             } else {
//               if (result[m].id_number != result[k].id_number) {
//                 secondArray.push({
//                   name: item.name,
//                   sick_type: item.sick_type,
//                   department: item.hcr_name,
//                   age: item.age,
//                   gender: item.gender,
//                   blood_group: item.blood_group,
//                   class_and_division: item.class_and_division,
//                   address: item.address,
//                   mobile_number: item.mobile_number,
//                   parent_name: item.parent_name,
//                   allergies_define: item.allergies_define,
//                   any_disease_define: item.any_disease_define,
//                   current_health_report: item.current_health_report,
//                   past_health_report: item.past_health_report
//                 });
//               }
//             }
//           }
//         }

//         // Organizing data into thirdArray (outside the loop)
//         const thirdArray = result.map(item => ({
//           name: item.name,
//           sick_type: item.sick_type,
//           consult_id: item.consult_id,
//           class_and_division: item.class_and_division,
//           id_number: item.id_number,
//           assignee: item.assignee,
//           hcr_name: item.hcr_name,
//           time: item.time,
//           date: item.formatted_date
//         }));

//         res.status(200).json({ Result: "Success", message: "Data Fetched Successfully",
//           firstArray, secondArray, thirdArray });
//       } else {
//         res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//       }
//     });
//   });
// });



//879754879358
// app.get('/get_student_and_parent_by_id', (req, res) => {
//   const idNumber = req.body.id_number;
  
//   // Get a connection from the pool
//   con.connect(function(err) {
//       if (err) {
//           console.error('Error connecting to database:', err);
//           res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//           return;
//       }
//       console.log("Connected!");  
//       // Use placeholders in the SQL query to prevent SQL injection
//       const sql = `SELECT 
//       d.assignee,
//       d.consult_id,
//       d.sick_type,
//       DATE_FORMAT(d.date, '%b %e,%Y') AS formatted_date,
//       stf.id_number as staff_id_nember,
//       c.hcr_name,            
//       hp.mobile_number,
//        hp.parent_name,
//       s.profile,
//       s.name,
//       s.id_number,
//       s.address,
//       s.allergies_define,
//       s.any_disease_define,
//       CONCAT(s.classes, '/', s.division) AS class_and_division,
//       CONCAT(d.from_time, ' - ', d.to_time) AS time,
//       s.blood_group,
//       s.gender,
//       DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),s.dob)), '%Y') + 0 AS age
//   FROM 
//        tblparent hp inner join 
//        tblclasses c
//   inner join
//       tblstudent s inner join tblconsulting d 
//   inner join tblstaff stf where  s.id_number = hp.id_number and c.division = s.division and c.classes_name = s.classes and d.id_number = s.id_number and stf.name = c.hcr_name  and  s.id_number=?`;
      
//       // Use parameterized query to avoid SQL injection
//       con.query(sql, [idNumber], function (err, result) {
//           if (err) {
//               console.error('Error executing SQL query:', err);
//               res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//               return;
//           } 
//           if (result.length > 0) {
//             console.log(`${result} records fetched`);
            
//             console.log(`${result.length} records fetched`);
              
//               // Organizing data into separate arrays
//               const firstArray = [];
//               const secondArray = [];

//               for (let i = 0; i < result.length; i++) {
//                   const item = result[i];
                  
//                   // Push data to firstArray
//                   firstArray.push({
//                       name: item.name,
//                       profile: item.profile,
//                       id_number: item.id_number
//                   });

//                   // Push data to secondArray
//                   secondArray.push({
//                       name: item.name,
//                       sick_type: item.sick_type,
//                       department: item.hcr_name,
//                       age: item.age,
//                       gender: item.gender,
//                       blood_group: item.blood_group,
//                       class_and_division: item.class_and_division,
//                       address: item.address,
//                       mobile_number: item.mobile_number,
//                       parent_name: item.parent_name,
//                       allergies_define: item.allergies_define,
//                       any_disease_define: item.any_disease_define,
//                       current_health_report: item.current_health_report, 
//                       past_health_report: item.past_health_report 
//                   });
//               }

//               // Organizing data into thirdArray (outside the loop)
//               const consultArray = result.map(item => ({
//                   name: item.name,
//                   sick_type: item.sick_type,
//                   consult_id: item.consult_id,
//                   class_and_division: item.class_and_division,
//                   id_number: item.id_number,
//                   assignee: item.assignee,
//                   hcr_name: item.hcr_name,
//                   time: item.time,
//                   date: item.formatted_date
//               }));

//               res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", firstArray, secondArray, consultArray });
//           } else {
//               res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//           }
//       });
//   });
// });


app.get('/get_all_student_list', (req, res) => { 
  res.header('Content-Type', 'application/json'); 
 
  try { 
      con.connect(function(err) { 
          if (err) throw err; 
          console.log("Connected!"); 
 
          const query = ` 
              SELECT  
              c.hcr_name, 
              s.updated_at, 
              s.division, 
              s.profile, 
              s.name, 
              hp.mobile_number 
              FROM  
                  tblclasses c 
              LEFT JOIN  
                  tblstudent s ON c.division = s.division 
              LEFT JOIN  
                  tblparent hp ON s.id_number = hp.id_number 
          `; 
 
          con.query(query, function (err, result) { 
              if (err) { 
                  console.error('Error executing SQL query:', err); 
                  res.status(500).json({ Result: "Failure", message: "Failed to fetch data" }); 
              } else { 
                  console.log(`${result.length} records fetched`); 
                  res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", 
data: result }); 
              } 
          }); 
      }); 
  } catch (err) { 
      console.error('Error:', err); 
      res.status(500).json({ Result: "Failure", message: err.message }); 
  } 
}); 

//--------------------------
app.get('/get_student_profile_by_id', async (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    const { id_number } = req.query;
    // Get a connection from the pool
    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT s.profile, s.name, s.id_number, s.address, s.gender, s.state, s.pincode, s.classes, s.division, s.dob, s.blood_group, s.department, s.allergies, s.any_disease, s.allergies_define, s.any_disease_define, s.current_health_report, s.past_health_report, p.parent_name, p.relation, p.mobile_number FROM tblstudent s INNER JOIN tblparent p ON s.id_number = 
      p.id_number WHERE s.id_number = ?`;
      con.query(sql, [id_number], function (err, result) {
        if (err) throw err;
        console.log("1 record shown");
        console.log('Result of staff Query ', result.length, '     ', result);
        if (result.length > 0) {
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        } else {
          res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
        }
      });
    });

  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

// app.get('/studentviewediting_profilebyid', (req, res) => { 
//   res.header('Content-Type', 'application/json'); 
//   try{ 
//     const{id_number} = req.body; 
//     con.connect(function(err) { 
//       if (err) throw err; 
//       console.log("Connected!"); 
//       var sql = `SELECT s.profile, s.name, s.id_number, s.address, s.gender, s.state, s.pincode, s.classes, s.division, s.dob, s.blood_group, s.department, s.allergies, s.any_disease, s.allergies_define, s.any_disease_define, s.current_health_report, s.past_health_report, p.parent_name, p.relation, p.mobile_number FROM tblstudent s INNER JOIN tblparent p ON s.id_number = 
// p.id_number WHERE s.id_number = ?`; 
//       con.query(sql, [id_number], function (err, result) { 
//         if (err) throw err; 
//         console.log("record view :" + JSON.stringify(result)); 
//         res.status(200).json({ Result: "Success", message: "Data view Successfully", result }); 
//       }); 
//     }); 
//   } catch (err) { 
//      console.error('Error:', err); 
//     res.status(500).json({ Result: "Failure", message: err.message }); 
//   }  
   
//  }); 

 ///update with token ---------------------------------------------------------------
//  app.put('/update_student_list', (req, res) => {
//   // Set the content type header to JSON
//   res.header('Content-Type', 'application/json');

//   try {
      

//       const {
//           name, id_number, address, gender, state, pincode,
//           classes, division, dob, blood_group, allergies, allergies_define,
//           any_disease, any_disease_define, parent_name, relation, mobile_number,organization_name, department
//       } = req.body;

//       const { profile, current_health_report, past_health_report } = req.body;
//       const profileBase64 = convertImageToBase64(profile, "png");
//       const currentBase64 = convertImageToBase64(current_health_report, "png");
//       const pastBase64 = convertImageToBase64(past_health_report, "png");

//       // Get a connection from the pool
//       con.connect(function (err) {
//           if (err) throw err;
//           console.log("Connected!");

//           // Start a transaction
//           con.beginTransaction(function (err) {
//               if (err) throw err;

//               // Update tblstudent
//               const updateStudentQuery = `
//                   UPDATE tblstudent
//                   SET 
//                       profile = ?,
//                       name = ?,
//                       address = ?,
//                       gender = ?,
//                       state = ?,
//                       pincode = ?,
//                       classes = ?,
//                       division = ?,
//                       dob = ?,
//                       blood_group = ?,
//                       allergies = ?,
//                       allergies_define = ?,
//                       any_disease = ?,
//                       any_disease_define = ?,
//                       current_health_report = ?,
//                       past_health_report = ?,
//                       updated_at = CURRENT_TIMESTAMP(),
//                       organization_name =?,
//                       department = ?
//                   WHERE id_number = ?
//               `;

//               con.query(updateStudentQuery,
//                   [profileBase64, name, address, gender, state, pincode,
//                   classes, division, dob, blood_group, allergies, allergies_define,
//                   any_disease, any_disease_define, currentBase64, pastBase64, organization_name, department, id_number],
//                   function (err, updateStudentResult) {
//                       if (err) {
//                           // Rollback the transaction if there is an error
//                           return con.rollback(function () {
//                               throw err;
//                           });
//                       }

//                       // Update tblparent
//                       const updateParentQuery = `
//                           UPDATE tblparent
//                           SET 
//                               parent_name = ?,
//                               relation = ?,
//                               mobile_number = ?,
//                               updated_at = CURRENT_TIMESTAMP()
//                           WHERE id_number = ?
//                       `;

//                       con.query(updateParentQuery,
//                           [parent_name, relation, mobile_number, id_number],
//                           function (err, updateParentResult) {
//                               if (err) {
//                                   // Rollback the transaction if there is an error
//                                   return con.rollback(function () {
//                                       throw err;
//                                   });
//                               }

//                               // Commit the transaction if all operations are successful
//                               con.commit(function (err) {
//                                   if (err) {
//                                       // Rollback the transaction if there is an error
//                                       return con.rollback(function () {
//                                           throw err;
//                                       });
//                                   }

//                                   console.log("Both records updated successfully");
//                                   res.status(200).json({
//                                       Result: "Success",
//                                       message: "Both records updated successfully",
//                                       updateStudentResult,
//                                       updateParentResult
//                                   });
//                               });
//                           });
//                   });
//           });
//       });

//   } catch (ex) {
//       console.error('Error:', ex);
//       res.status(500).json({ Result: "Failure", message: ex.message });
//   }
// });

//update without token---------------------------------------------------------------------------------
app.put('/updatestudent', (req, res) => { 
  res.header('Content-Type', 'application/json'); 
 
  try { 
      const { 
          name, id_number, address, gender, state, pincode, 
          classes, division, dob, blood_group, allergies, allergies_define, 
          any_disease, any_disease_define, parent_name, relation, 
mobile_number,organization_name,department 
      } = req.body; 
 
      const { profile, current_health_report, past_health_report } = req.body; 
      const profileBase64 = profile == null ? null : convertImageToBase64(profile, "png");
    const currentBase64 = current_health_report == null ? null : convertImageToBase64(current_health_report, "png");
    const pastBase64 = past_health_report == null ? null : convertImageToBase64(past_health_report, "png");
       
      // Get a connection from the pool 
      con.connect(function (err) { 
          if (err) throw err; 
          console.log("Connected!"); 
 
          // Start a transaction 
          con.beginTransaction(function (err) { 
              if (err) throw err; 
 
              // Update tblstudent 
              const updateStudentQuery = ` 
                  UPDATE tblstudent 
                  SET  
                      profile = ?, 
                      name = ?, 
                      address = ?, 
                      gender = ?, 
                      state = ?, 
                      pincode = ?, 
                      classes = ?, 
                      division = ?, 
                      dob = ?, 
                      blood_group = ?, 
                      allergies = ?, 
                      allergies_define = ?, 
                      any_disease = ?, 
                      any_disease_define = ?, 
                      current_health_report = ?, 
                      past_health_report = ?, 
                      updated_at = CURRENT_TIMESTAMP(), 
                      organization_name =?, 
                      department = ? 
                  WHERE id_number = ? 
              `; 
 
              con.query(updateStudentQuery, 
                  [profileBase64, name, address, gender, state, pincode, 
                      classes, division, dob, blood_group, allergies, allergies_define, 
                      any_disease, any_disease_define, currentBase64, pastBase64, 
organization_name,department, id_number], 
                  function (err, updateStudentResult) { 
                      if (err) { 
                          // Rollback the transaction if there is an error 
                          return con.rollback(function () { 
                              throw err; 
                          }); 
                      } 
 
                      // Update tblparent 
                      const updateParentQuery = ` 
                          UPDATE tblparent 
                          SET  
                              parent_name = ?, 
                              relation = ?, 
                              mobile_number = ?, 
                              updated_at = CURRENT_TIMESTAMP() 
                          WHERE id_number = ? 
                      `; 
 
                      con.query(updateParentQuery, 
                          [parent_name, relation, mobile_number, id_number], 
                          function (err, updateParentResult) { 
                              if (err) { 
                                  // Rollback the transaction if there is an error 
                                  return con.rollback(function () { 
                                      throw err; 
                                  }); 
                              } 
 
                              // Commit the transaction if all operations are successful 
                              con.commit(function (err) { 
                                  if (err) { 
                                      // Rollback the transaction if there is an error 
                                      return con.rollback(function () { 
                                          throw err; 
                                      }); 
                                  } 
 
                                  console.log("Both records updated successfully"); 
                                  res.status(200).json({ 
                                      Result: "Success", 
                                      message: "Both records updated successfully", 
                                      updateStudentResult, 
                                      updateParentResult 
                                  }); 
                              }); 
                          }); 
                  }); 
          }); 
      }); 
 
  } catch (ex) { 
      console.error('Error:', ex); 
      res.status(500).json({ Result: "Failure", message: ex.message }); 
  } 
}); 


// app.get('/soft_delete_student_to_delete', (req, res) => {
// const idNumber = req.body.id_number;

// // Get a connection from the pool
// con.connect(function(err) {
//   if (err) {
//       console.error('Error connecting to database:', err);
//       res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//       return;
//   }

//   console.log("Connected!");

//   // Use placeholders in the SQL query to prevent SQL injection
//   const softDeleteSql = `
//       UPDATE tblstudent
//       SET division = false
//       WHERE id_number = ?`;

//   // Use parameterized query to avoid SQL injection
//   con.query(softDeleteSql, [idNumber], function (err, deleteResult) {
//       if (err) {
//           console.error('Error executing SQL query:', err);
//           res.status(500).json({ Result: "Failure", message: "Failed to soft delete student" });
//       } else if (deleteResult.affectedRows > 0) {
//           console.log(`Soft delete successful for ${deleteResult.affectedRows} record(s)`);

//           // If soft delete is successful, you might choose to return a success message
//           res.status(200).json({ Result: "Success", message: "Soft delete successful" });
//       } else {
//           // If no rows were affected, the record might not exist or already be soft-deleted
//           res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//       }
//   });
// });
// });


// app.get('/softdelete_student', (req, res) => {
// const idNumber = req.query.id_number;

// // Get a connection from the pool
// con.connect(function(err) {
// if (err) {
//     console.error('Error connecting to database:', err);
//     res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//     return;
// }

// console.log("Connected!");

// // Use placeholders in the SQL query to prevent SQL injection
// const softDeleteSql = `
// UPDATE tblstudent
// SET is_deleted = 1
// WHERE id_number = ?`;

// // Use parameterized query to avoid SQL injection
// con.query(softDeleteSql, [idNumber], function (err, deleteResult) {
//     if (err) {
//         console.error('Error executing SQL query:', err);
//         res.status(500).json({ Result: "Failure", message: "Failed to soft delete student" });
//     } else if (deleteResult.affectedRows > 0) {
//         console.log(`Soft delete successful for ${deleteResult.affectedRows} record(s)`);

//         // If soft delete is successful, you might choose to return a success message
//         res.status(200).json({ Result: "Success", message: "Soft delete successful" });
//     } else {
//         // If no rows were affected, the record might not exist or already be soft-deleted
//         res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//     }
// });
// });
// });

app.get('/softdelete_student', (req, res) => {
  const idNumber = req.query.id_number;
  
  // Get a connection from the pool
  con.connect(function(err) {
      if (err) {
          console.error('Error connecting to database:', err);
          res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
          return;
      }
      
      console.log("Connected!");
      
      // Use placeholders in the SQL query to prevent SQL injection
      const selectSql = `
      SELECT s.profile, s.name, s.role,CONCAT(s.classes, '(', s.division,')') AS class_and_division , p.mobile_number
        FROM tblstudent s
        LEFT JOIN tblparent p ON s.id_number = p.id_number
        WHERE s.id_number = ?`;
      
      // Use parameterized query to avoid SQL injection
      con.query(selectSql, [idNumber], function (err, selectResult) {
          if (err) {
              console.error('Error executing SQL query:', err);
              res.status(500).json({ Result: "Failure", message: "Failed to fetch student details" });
          } else if (selectResult.length > 0) { 
              const studentDetails = selectResult[0]; // Assuming only one student is returned
              
              // Soft delete student
              const softDeleteSql = `
              UPDATE tblstudent AS s
INNER JOIN tblparent AS p ON s.id = p.id
SET s.is_deleted = 1, p.is_deleted = 1
WHERE s.id_number = ?`;
              
              // Use parameterized query to avoid SQL injection
              con.query(softDeleteSql, [idNumber], function (err, deleteResult) {
                  if (err) {
                      console.error('Error executing SQL query:', err);
                      res.status(500).json({ Result: "Failure", message: "Failed to soft delete student" });
                  } else if (deleteResult.affectedRows > 0) {
                      console.log(`Soft delete successful for ${deleteResult.affectedRows} record(s)`);
          
                      // If soft delete is successful, return a success message along with student details
                      res.status(200).json({ Result: "Success", message: "Soft delete successful", student: studentDetails });
                  } else {
                      // If no rows were affected, the record might not exist or already be soft-deleted
                      res.status(404).json({ Result: "Failure", message: "No records found for the provided id" });
                  }
              });
          } else {
              res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
          }
      });
  });
});

app.get('/softdelete_staff', (req, res) => {
  const idNumber = req.query.id_number;
  
  // Get a connection from the pool
  con.connect(function(err) {
      if (err) {
          console.error('Error connecting to database:', err);
          res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
          return;
      }
      
      console.log("Connected!");
      
      // Use placeholders in the SQL query to prevent SQL injection
      const selectSql = `
      SELECT profile, name, role,CONCAT(classes,'(',division,')') AS class_and_division , mobile_number
        FROM tblstaff
        WHERE id_number = ?`;
      
      // Use parameterized query to avoid SQL injection
      con.query(selectSql, [idNumber], function (err, selectResult) {
          if (err) {
              console.error('Error executing SQL query:', err);
              res.status(500).json({ Result: "Failure", message: "Failed to fetch student details" });
          } else if (selectResult.length > 0) {
              const studentDetails = selectResult[0]; // Assuming only one student is returned
              
              // Soft delete student
              const softDeleteSql = `
              UPDATE tblstaff
              SET is_deleted = 1
              WHERE id_number = ?`;
              
              // Use parameterized query to avoid SQL injection
              con.query(softDeleteSql, [idNumber], function (err, deleteResult) {
                  if (err) {
                      console.error('Error executing SQL query:', err);
                      res.status(500).json({ Result: "Failure", message: "Failed to soft delete student" });
                  } else if (deleteResult.affectedRows > 0) {
                      console.log(`Soft delete successful for ${deleteResult.affectedRows} record(s)`);
          
                      // If soft delete is successful, return a success message along with student details
                      res.status(200).json({ Result: "Success", message: "Soft delete successful", student: studentDetails });
                  } else {
                      // If no rows were affected, the record might not exist or already be soft-deleted
                      res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
                  }
              });
          } else {
              res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
          }
      });
  });
});


//new softdelete code

// app.get('/softdelete_staff', (req, res) => {
//   const idNumber = req.query.id;
  
//   // Get a connection from the pool
//   con.connect(function(err) {
//       if (err) {
//           console.error('Error connecting to database:', err);
//           res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//           return;
//       }
      
//       console.log("Connected!");
      
//       // Use placeholders in the SQL query to prevent SQL injection
//       const selectSql = `
//       SELECT profile, name, role, CONCAT(classes,'(',division,')') AS class_and_division, mobile_number
//         FROM tblstaff WHERE id = ?`;
      
//       // Use parameterized query to avoid SQL injection
//       con.query(selectSql, [idNumber], function (err, selectResult) {
//           if (err) {
//               console.error('Error executing SQL query:', err);
//               res.status(500).json({ Result: "Failure", message: "Failed to fetch staff details" });
//           } else if (selectResult.length > 0) {
//               const staffDetails = selectResult[0]; // Assuming only one staff is returned
              
//               // Soft delete staff
//               const softDeleteSql = `
//               UPDATE tblstaff
//               SET is_deleted = 1
//               WHERE id = ?`;
              
//               // Use parameterized query to avoid SQL injection
//               con.query(softDeleteSql, [idNumber], function (err, deleteResult) {
//                   if (err) {
//                       console.error('Error executing SQL query:', err);
//                       res.status(500).json({ Result: "Failure", message: "Failed to soft delete staff" });
//                   } else if (deleteResult.affectedRows > 0) {
//                       console.log(`Soft delete successful for ${deleteResult.affectedRows} record(s)`);
          
//                       // If soft delete is successful, return a success message along with staff details
//                       res.status(200).json({ Result: "Success", message: "Soft delete successful", staff: staffDetails });
//                   } else {
//                       // If no rows were affected, the record might not exist or already be soft-deleted
//                       res.status(404).json({ Result: "Failure", message: "No records found for the provided id" });
//                   }
//               });
//           } else {
//               res.status(404).json({ Result: "Failure", message: "No records found for the provided id" });
//           }
//       });
//   });
// });

app.put('/recovery_student_and_staff', (req, res) => {
  const idNumber = req.body.id_number;

  // Get a connection from the pool
  con.connect(function(err) {
      if (err) {
          console.error('Error connecting to database:', err);
          res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
          return;
      }

      console.log("Connected!");

      // Use placeholders in the SQL query to prevent SQL injection
      const softDeleteSql = `
          UPDATE tblstudent
          SET is_deleted = 0
          WHERE id_number = ?`;

      // Use placeholders in the SQL query to prevent SQL injection for staff table as well
      const softDeleteStaffSql = `
      UPDATE tblstaff
      SET is_deleted = 0
      WHERE id_number = ?`;

      // Use transaction to ensure atomicity
      con.beginTransaction(function(err) {
          if (err) {
              console.error('Error starting transaction:', err);
              res.status(500).json({ Result: "Failure", message: "Failed to start transaction" });
              return;
          }

          // Soft delete student
          con.query(softDeleteSql, [idNumber], function (err, deleteStudentResult) {
              if (err) {
                  con.rollback(function() {
                      console.error('Error executing SQL query for student:', err);
                      res.status(500).json({ Result: "Failure", message: "Failed to soft delete student" });
                  });
                  return;
              }

              // Soft delete staff
              con.query(softDeleteStaffSql, [idNumber], function (err, deleteStaffResult) {
                  if (err) {
                      con.rollback(function() {
                          console.error('Error executing SQL query for staff:', err);
                          res.status(500).json({ Result: "Failure", message: "Failed to soft delete staff" });
                      });
                      return;
                  }

                  // Commit the transaction if both queries are successful
                  con.commit(function(err) {
                      if (err) {
                          con.rollback(function() {
                              console.error('Error committing transaction:', err);
                              res.status(500).json({ Result: "Failure", message: "Failed to commit transaction" });
                          });
                          return;
                      }
                      console.log(`Soft delete successful for student: ${deleteStudentResult.affectedRows} record(s), staff: ${deleteStaffResult.affectedRows} record(s)`);

                      // If soft delete is successful for both student and staff, return success message
                      res.status(200).json({ Result: "Success", message: "Soft delete successful for student and staff" });
                  });
              });
          });
      });
  });
});


app.get('/recoveryviewall', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    // Get a connection from the pool
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");

      // First SQL query for staff
      var sqlStaff = `SELECT profile, name, CONCAT(classes, '(', division,')') AS class_and_division, role, mobile_number, updated_at FROM tblstaff where (is_deleted = 1)`;
      con.query(sqlStaff, function (err, staffResult) {
        if (err) throw err;

        // Second SQL query for students and their parents
        var sqlStudentsAndParents = `SELECT s.profile, s.name, CONCAT(s.classes, '(', s.division,')') AS class_and_division, s.role, p.mobile_number, s.updated_at 
                                     FROM tblstudent s 
                                     INNER JOIN tblparent p ON s.id_number = p.id_number 
                                     WHERE s.is_deleted = 1`;
        con.query(sqlStudentsAndParents, function (err, studentResult) {
          if (err) throw err;

          console.log("Records fetched successfully");
          res.status(200).json({ Result: "Success", message: "Data view Successfully", staffResult, studentResult });
        });
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});


// app.get('/viewstudentrecovery', (req, res) => {
//   const idNumber = req.body.id_number;
  
//   // Get a connection from the pool
//   con.connect(function(err) {
//       if (err) {
//           console.error('Error connecting to database:', err);
//           res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//           return;
//       }
  
//       console.log("Connected!");
  
//       // Use placeholders in the SQL query to prevent SQL injection
//       const sql = `
//       SELECT          
//               p.mobile_number,
//               s.profile,
//               s.name,
//               s.id_number,
//               s.address,
//               s.allergies_define,
//               s.any_disease_define,
//               CONCAT(s.classes, '/', s.division) AS class_and_division,
//               s.blood_group,
//               s.gender,
//               DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),s.dob)), '%Y') + 0 AS age
//           FROM 
//                tblparent hp inner join 
//               tblstudent s 
//       where  s.id_number = hp.id_number and c.division = s.division and c.classes_name = s.classes and d.id_number = s.id_number   and  s.id_number=?`;
  
//       // Use parameterized query to avoid SQL injection
//       con.query(sql, [idNumber], function (err, result) {
//           if (err) {
//               console.error('Error executing SQL query:', err);
//               res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//           } else {
//               if (result.length > 0) {
//                   console.log(`${result.length} records fetched`);
//                   res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", data: result });
//               } else {
//                   res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//               }
//           }
//       });
//   });
//   });

       //view all student list

//view by id STU DETAIL inner join code for student details (student, parent (dummy doctor))         



// app.put('/update_student_list', (req, res) => {
//   res.header('Content-Type', 'application/json');

//   try {
//       const { id_number, updatedData } = req.body;

//       if (!id_number || !updatedData) {
//           return res.status(400).json({ Result: "Failure", message: "Missing required parameters" });
//       }

//       con.connect(function (err) {
//           if (err) throw err;

//           const updateQuery = `
//               UPDATE tblclasses c
//               LEFT JOIN tblstudent s ON c.id_number = s.id_number
//               LEFT JOIN tblparent hp ON s.id_number = hp.id_number
//               SET
//                 c.hcr = ?,
//                 s.updated_at = ?,
//                 s.division = ?,
//                 s.profile = ?,
//                 s.name = ?,
          
//                 hp.mobile_number = ?
//               WHERE
//                 c.id_number = ?
//           `;

//           con.query(updateQuery, [
//               updatedData.HCR,
//               updatedData.updated_at,
//               updatedData.division,
//               updatedData.profile,
//               updatedData.name,                        
//               updatedData.mobile_number,
//               id_number
//           ], function (err, result) {
//               if (err) {
//                   console.error('Error executing SQL query:', err);
//                   res.status(500).json({ Result: "Failure", message: "Failed to update data" });
//               } else {
//                   if (result.affectedRows > 0) {
//                       console.log('Data updated successfully');
//                       res.status(200).json({ Result: "Success", message: "Data updated successfully" });
//                   } else {
//                       console.log('No matching record found');
//                       res.status(404).json({ Result: "Failure", message: "No matching record found" });
//                   }
//               }
//           });
//       });
//   } catch (err) {
//       console.error('Error:', err);
//       res.status(500).json({ Result: "Failure", message: err.message });
//   }
// });



  app.post('/adddepartment', (req, res) =>{
    res.header('Content-Type', 'application/json');
    try{
      const{department, updated_by} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `INSERT INTO tbldepartment ( department, updated_by, doc, created_date,  updated_at) VALUES (?,?, NOW(),NOW(), CURRENT_TIMESTAMP())`;
        con.query(sql, [department, updated_by], function (err, result) {
          if (err) throw err;
          console.log("record inserted");
          res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
        });
      });
    } catch   (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });
  
  
  app.put('/updatedepartment',(req, res) => {
    res.header('Content-Type', 'application/json');
  
    try{
      const{id, department, updated_by} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `UPDATE tbldepartment SET department =?, dou = NOW(), updated_by =?, updated_at = CURRENT_TIMESTAMP() WHERE id =?`;
        con.query(sql, [department, updated_by, id], function (err, result) {
          if (err) throw err;
          console.log("1 record updated");
          res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        });
      });
    } catch   (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    } 
    
  });
  
  
  app.delete('/deletedepartment',(req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const{id} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `DELETE FROM tbldepartment WHERE id =?`;
        con.query(sql, [id], function (err, result) {
          if (err) throw err;
          console.log("record deleted");
          res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
        });
      });
    } catch (e) {
      console.error('Error:', e);
      res.status(500).json({ Result: "Failure", message: e.message });
    }
  });
  
  app.get('/viewdepartment', (req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `SELECT * FROM tbldepartment`;
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log("1 record viewed");
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }  
  });
  
  
  app.get('/view_deparment_id', (req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const{id} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `SELECT * FROM tbldepartment WHERE id =?`;
        con.query(sql, [id], function (err, result) {
          if (err) throw err;
          console.log("record view");
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }  
  });
  
  
  app.get('/search_department', (req, res) => {
    let keyword = req.body.department;
    let sql = 'SELECT * FROM tbldepartment WHERE department LIKE ?';
     let temp = '%'.concat(keyword).concat('%');
    console.log('keyword : ',  temp);
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
        con.query(sql, [temp], function (err, result) {
        if (err) throw err;
        console.log("record view");
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  });
  
  //--------------------velu
  app.post('/add_designation', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
      const { staff_name, designation_role, updated_by } = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `INSERT INTO tbldesignation ( staff_name, designation_role, updated_by, doc, updated_at) VALUES (?, ?, ?, ?, NOW(), CURRENT_TIMESTAMP())`;
        con.query(sql, [ staff_name, designation_role, updated_by], function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ Result: "Failure", message: "Failed to insert data" });
          } else {
            console.log("1 record inserted");
            res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
          }
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }  
  });
  
  
  app.put('/update_designtion', (req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const{id, staff_name, designation_role, updated_by} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `UPDATE tbldesignation SET staff_name =?, designation_role =?, dou = NOW(), updated_by =?, updated_at = CURRENT_TIMESTAMP() WHERE id =?`;
        con.query(sql, [staff_name, designation_role, updated_by, id], function (err, result) {
          if (err) throw err;
          console.log("1 record updated");
          res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        });
      });
      } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
      }    
    });
  
  
    app.get('/view_designation_id',  (req, res)=> {
  
      res.header('Content-Type', 'application/json');
      try{
        const{id} = req.body;
        con.connect(function(err) {
          if (err) throw err;
          console.log("Connected!");
          var sql = `SELECT * FROM tbldesignation WHERE id =?`;
          con.query(sql, [id], function (err, result) {
            if (err) throw err;
            console.log("record view :" + JSON.stringify(result));
            res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
          });
        });
      } catch (err) {
         console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
      }    
      
    });
  
    app.get('/view_designation', (req, res) => {
      res.header('Content-Type', 'application/json');
      try{
        con.connect(function(err) {
          if (err) throw err;
          console.log("Connected!");
          var sql = `SELECT * FROM tbldesignation`;
          con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("record viewed");
            res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
          });
        });
      } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
      }       
    });
  
  
    app.delete('/delete_designation', (req, res) => {
      res.header('Content-Type', 'application/json');
      try{
        const{id} = req.body;
        con.connect(function(err) {
          if (err) throw err;
          console.log("Connected!");
          var sql = `DELETE FROM tbldesignation WHERE id =?`;
          con.query(sql, [id], function (err, result) {
            if (err) throw err;
            console.log("record deleted");
            res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
          });
        });
      } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
      }      
    });
  
    app.get('/search_designation', (req, res)=> {
      const keyword = req.body.designation_role; 
      let sql = 'SELECT * FROM tbldesignation WHERE designation_role LIKE ?';
       let temp1 = '%'.concat(keyword).concat('%');
      console.log('keyword : ',  temp1);
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
          con.query(sql, [temp1], function (err, result) {
          if (err) throw err;
          console.log("record view :" + JSON.stringify(result));
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        });
      });
    });
  
  
  
  //-----------------classes
  app.post('/add_classes', (req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const {classes_name, division, department,strength, hcr_name, updated_by, id_number } = req.body;
      console.log(classes_name, division, department,strength, hcr_name,updated_by, id_number);
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `INSERT INTO tblclasses ( classes_name, division, department,strength, hcr_name, updated_by, last_update,  doc, updated_at, id_number) VALUES (?,?,?,?,?,?, NOW(), NOW(), CURRENT_TIMESTAMP(), ?)`;
        con.query(sql, [ classes_name, division, department,strength, hcr_name, updated_by, id_number], function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ Result: "Failure", message: "Failed to insert data" });
          } else {
            console.log("1 record inserted");
            res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
          }
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }     
  });
  
  
  app.get('/view_classes', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tblclasses`;
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("record viewed");
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  } 
  
  });
  
  
  app.get('/view_classes_id', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT * FROM tblclasses WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record view :" + JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });
  } catch (err) {
     console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }
  
  
  });
  
  
  app.put('/update_classes', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id, classes_name, division, department,hcr_name, updated_by} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `UPDATE tblclasses SET classes_name =?, division =?, department =?,strength=?, hcr_name =?,dou=NOW(), updated_by =?, updated_at = CURRENT_TIMESTAMP() WHERE id =?`;
      con.query(sql, [classes_name, division, department,strength, hcr_name, updated_by, id], function (err, result) {
        if (err) throw err;
        console.log("1 record updated");
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }
  
  });
  
  app.delete('/delete_classes', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const{id} = req.body;
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `DELETE FROM tblclasses WHERE id =?`;
      con.query(sql, [id], function (err, result) {
        if (err) throw err;
        console.log("record deleted");
        res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  } 
  
  });
  
  app.get('/search_classes', (req, res) => {
  res.header('Content-Type', 'application/json');
  const keyword = req.body.classes_name;
  let sql = "SELECT * FROM tblclasses WHERE `classes_name` LIKE ? OR `division` LIKE ? `strength` LIKE OR `department` LIKE ? OR `hcr_name` LIKE ?";
  let temp1 = '%'.concat(keyword).concat('%');
  console.log('keyword : ',  temp1);
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
      con.query(sql, [temp1, temp1, temp1,temp1 ], function (err, result) {
      if (err) throw err;
      console.log("record view :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
    });
  }); 
  });
  
  //-----------------------------CONTACT US---  

  app.post('/contactus', async(req, res) => {
    const { name, email, message } = req.body;

    // Replace these with your actual email and SMTP server details
    var transporter = nodemailer.createTransport( {
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      auth: {
          user: "elanchezhian789@outlook.com",
          pass: "90038elan"
      },
      tls: {
          ciphers:'SSLv3'
      }
  });
    const mailOptions = {
        from: 'elanchezhian789@outlook.com',
        to: 'rockerelan@gmail.com',
        //to: email,
        subject: 'Medshyne Contact Us',
        message: message,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



//---------------------------------------CONSULTANT HISTORY PAGE--------------------------------

app.get('/get_consulting_api_a', (req, res) => {
  res.header('Content-Type', 'application/json');
  con.connect(function (err) {
      if (err) {
          console.error("Connection error:", err);
          res.status(500).json({ Result: "Failure", message: "Database connection error" });
          return;
      }
      console.log("Connected!");
      var sql = `SELECT 
          c.patient_name, c.sick_type, c.consult_id, 
          CONCAT(c.classes, '/', c.division) AS class_and_division, 
          DATE_FORMAT(c.date, '%b %e,%Y') AS date,
          c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i%p)') AS from_time,
          CASE 
              WHEN p.mobile_number IS NOT NULL THEN p.mobile_number
              ELSE st.mobile_number 
          END AS mobile_number, 
          c.hcr_name, st.id_number AS hcr_id_number
      FROM 
          tblconsulting c
      LEFT JOIN 
          tblparent p ON c.id_number = p.id_number
      LEFT JOIN 
          tblstaff st ON c.hcr_name = st.name
      LEFT JOIN 
          tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
      WHERE 
          c.status IN ('completed')`;

      con.query(sql, function (err, result) {
          if (err) {
              console.error("Query error:", err);
              res.status(500).json({ Result: "Failure", message: "Error executing query" });
              return;
          }
          console.log(`${result.length} record(s) retrieved`);

          const arrayList = result.map(item => ({
              patient_name: item.patient_name,
              sick_type: item.sick_type,
              consult_id: item.consult_id,
              class_and_division: item.class_and_division,
              date: item.date,
              id_number: item.id_number,
              consult_id: item.consult_id,
              mobile_number: item.mobile_number,
              hcr_name: item.hcr_name, 
              assignee: item.assignee,
              hcr_id_number: item.hcr_id_number,
              from_time: item.from_time 
          }));

          // const balanceArrayList = result.map(item => ({
          //     id_number: item.id_number,
          //     consult_id: item.consult_id,
          //     mobile_number: item.mobile_number,
          //     hcr_name: item.hcr_name, 
          //     assignee: item.assignee,
          //     hcr_id_number: item.hcr_id_number,
          //     from_time: item.from_time 
          // }));

          // Constructing JSON response object
          const jsonResponse = {
              Result: "Success",
              message: "Data viewed successfully",
              arrayList: arrayList
              //balanceArrayList: balanceArrayList
          };

          // Sending JSON response
          res.status(200).json(jsonResponse);
      });
  });
}); 


app.get('/get_consulting_api_b', (req, res) => {
res.header('Content-Type', 'application/json');
con.connect(function (err) {
    if (err) {
        console.error("Connection error:", err);
        res.status(500).json({ Result: "Failure", message: "Database connection error" });
        return;
    }
    console.log("Connected!");
    var sql = `SELECT 
        c.patient_name, c.sick_type, c.consult_id, 
        CONCAT(c.classes, '/', c.division) AS class_and_division, 
        DATE_FORMAT(c.date, '%b %e,%Y') AS date,
        c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i%p)') AS from_time,
        CASE 
            WHEN p.mobile_number IS NOT NULL THEN p.mobile_number
            ELSE st.mobile_number 
        END AS mobile_number, 
        c.hcr_name, st.id_number AS hcr_id_number
    FROM 
        tblconsulting c
    LEFT JOIN 
        tblparent p ON c.id_number = p.id_number
    LEFT JOIN 
        tblstaff st ON c.hcr_name = st.name
    LEFT JOIN 
        tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
    WHERE 
        c.status IN ('new', 'waiting', 'cancelled')`;

    con.query(sql, function (err, result) {
        if (err) {
            console.error("Query error:", err);
            res.status(500).json({ Result: "Failure", message: "Error executing query" });
            return;
        }
        console.log(`${result.length} record(s) retrieved`);

        const arrayList = result.map(item => ({
            patient_name: item.patient_name,
            sick_type: item.sick_type,
            consult_id: item.consult_id,
            class_and_division: item.class_and_division,
            date: item.date,
            id_number: item.id_number,
            consult_id: item.consult_id,
            mobile_number: item.mobile_number,
            hcr_name: item.hcr_name, 
            assignee: item.assignee,
            hcr_id_number: item.hcr_id_number,
            from_time: item.from_time 
        }));

        // const balanceArrayList = result.map(item => ({
        //     id_number: item.id_number,
        //     consult_id: item.consult_id,
        //     mobile_number: item.mobile_number,
        //     hcr_name: item.hcr_name, // Assuming hcr_name is what you intended
        //     assignee: item.assignee,
        //     hcr_id_number: item.hcr_id_number,
        //     from_time: item.from_time // Assuming this is what you wanted
        // }));

        // Constructing JSON response object
        const jsonResponse = {
            Result: "Success",
            message: "Data viewed successfully",
            arrayList: arrayList
           // balanceArrayList: balanceArrayList
        };

        // Sending JSON response
        res.status(200).json(jsonResponse);
    });
});
});
app.get('/date_filter_a', (req, res)=>{
  res.header('Content-Type', 'application/json');
  try {
    const start_date = req.body.start_date; // Start date for the calendar filter
    const end_date = req.body.end_date; // End date for the calendar filter

    // Check if start and end dates are provided
    if (!start_date || !end_date) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide valid start_date and end_date"
      });
    }
      var sql = `SELECT 
               c.patient_name, c.sick_type, c.consult_id, 
               CONCAT(c.classes, '/', c.division) AS class_and_division, 
               DATE_FORMAT(c.date, '%b %e,%Y') AS formatted_date,
               c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i%p)') AS formatted_from_time,
                 CASE 
                WHEN p.mobile_number IS NOT NULL THEN p.mobile_number
              ELSE st.mobile_number 
              END AS mobile_number, 
              c.hcr_name, st.id_number AS hcr_id_number
                 FROM 
              tblconsulting c
               LEFT JOIN 
                tblparent p ON c.id_number = p.id_number
                LEFT JOIN 
                tblstaff st ON c.hcr_name = st.name
                 LEFT JOIN 
                  tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
                    WHERE 
                    c.status IN ('completed') and 
                    c.date >= ? AND c.date <= ?`;

        con.query(sql, [start_date, end_date], function (err, result) {
        if (err) throw err;
        console.log(`${result.length} record(s) retrieved`);

        // Creating array list
        const arrayList = result.map(item => ({
          patient_name: item.patient_name,
          sick_type: item.sick_type,
          consult_id: item.consult_id,
          date: item.formatted_date,
          class_and_division: item.class_and_division,
          id_number: item.id_number,
          assignee: item.assignee,
          mobile_number: item.mobile_number,
          hcr: item.hcr_name,
          hcr_id_number: item.hcr_id_number,
          from_time: item.formatted_from_time
        }));

        // Creating another array list (balanceArrayList)
       

        res.status(200).json({ Result: "Success", message: "Data viewed successfully", arrayList });
      });
  } catch   (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});


app.get('/date_filter_b', (req, res)=>{
  res.header('Content-Type', 'application/json');
  try {
    const start_date = req.body.start_date; // Start date for the calendar filter
    const end_date = req.body.end_date; // End date for the calendar filter

    // Check if start and end dates are provided
    if (!start_date || !end_date) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide valid start_date and end_date"
      });
    }
      var sql = `SELECT 
               c.patient_name, c.sick_type, c.consult_id, 
               CONCAT(c.classes, '/', c.division) AS class_and_division, 
               DATE_FORMAT(c.date, '%b %e,%Y') AS formatted_date,
               c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i%p)') AS formatted_from_time,
                 CASE 
                WHEN p.mobile_number IS NOT NULL THEN p.mobile_number
              ELSE st.mobile_number 
              END AS mobile_number, 
              c.hcr_name, st.id_number AS hcr_id_number
                 FROM 
              tblconsulting c
               LEFT JOIN 
                tblparent p ON c.id_number = p.id_number
                LEFT JOIN 
                tblstaff st ON c.hcr_name = st.name
                 LEFT JOIN 
                  tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
                    WHERE 
                    c.status IN ('new','waiting','cancelled') and 
                    c.date >= ? AND c.date <= ?`;

        con.query(sql, [start_date, end_date], function (err, result) {
        if (err) throw err;
        console.log(`${result.length} record(s) retrieved`);

        // Creating array list
        const arrayList = result.map(item => ({
          patient_name: item.patient_name,
          sick_type: item.sick_type,
          consult_id: item.consult_id,
          date: item.formatted_date,
          class_and_division: item.class_and_division,
          id_number: item.id_number,
          assignee: item.assignee,
          mobile_number: item.mobile_number,
          hcr: item.hcr_name,
          hcr_id_number: item.hcr_id_number,
          from_time: item.formatted_from_time
        }));

        // Creating another array list (balanceArrayList)
        

        res.status(200).json({ Result: "Success", message: "Data viewed successfully", arrayList });
      });
  } catch   (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});
  app.get('/search_c_history', (req, res) => {
    res.header('Content-Type', 'application/json');   

  
    try {
      const keyword = req.body.patient_name;
    console.log(keyword);
      // Query to search data
      const sql = `
        SELECT 
          c.patient_name, c.sick_type, c.consult_id, c.classes, c.division, c.date, c.id_number, c.assignee, c.from_time,
          cl.hcr_name AS class_hcr,
          st.mobile_number AS staff_mobile_number, st.id_number AS staff_id_number,
          p.mobile_number AS parent_mobile_number
        FROM 
          tblconsulting c
        LEFT JOIN 
          tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
        LEFT JOIN 
          tblstaff st ON c.hcr_name = st.name
        LEFT JOIN 
          tblparent p ON c.id_number = p.id_number
        WHERE 
          c.patient_name LIKE ? OR
          c.sick_type LIKE ? OR
          c.classes LIKE ? OR
          c.division LIKE ? OR
          c.assignee LIKE ? OR
          cl.hcr_name LIKE ? OR
          st.mobile_number LIKE ? OR
          st.id_number LIKE ? OR
          p.mobile_number LIKE ?
      `;
  
      const searchTerm = `%${keyword}%`;
      console.log('keyword : ',  searchTerm);
  
      // Execute the query
      con.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (error, results, fields) => {
        if (error) {
          console.error('Error executing SQL query:', error);
          res.status(500).json({ Result: "Failure", message: "Error executing SQL query" });
          return;
        }

        if (!Array.isArray(results)) {
          console.error('Query result is not iterable');
          res.status(500).json({ Result: "Failure", message: "Query result is not iterable" });
          return;
        }
  
        // Send the search results as JSON response
        res.status(200).json({ Result: "Success", data: results });
      });
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({ Result: "Failure", message: error.message });
    }
  });

  //--------------------------SUBSCRIPTION DETAILS------------------------


  app.post('/insert_subscription', (req, res) => {
    res.header('Content-Type', 'application/json');
    try { 
        const { transition_method, price, plans, status, invoice, remainingdays } = req.body;
     
        var sql = `INSERT INTO tbltransaction (transition_method, datetime, price, plans, status, invoice, remainingdays) VALUES (?, NOW(), ?, ?, ?, ?, ?)`;
        
        con.query(sql, [transition_method, price, plans, status, invoice, remainingdays], function (err, result) {
            if (err) {
                console.error('Error inserting record:', err);
                res.status(500).json({ Result: "Failure", message: err.message });
                return;
            }
            console.log("Record inserted:", JSON.stringify(result));
            res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
        });
    } catch (e) {
        console.error('Error:', e);
        res.status(500).json({ Result: "Failure", message: e.message });
    }
});

app.get('/view_subscription', (req, res) => {
  try {
      var sql = `SELECT * FROM tbltransaction`;
      con.query(sql, function (err, result) {
          if (err) {
              console.error('Error fetching records:', err);
              res.status(500).json({ Result: "Failure", message: err.message });
              return;
          }
          console.log("Records fetched:", result);
          res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", data: result });
      });
  } catch (e) {
      console.error('Error:', e);
      res.status(500).json({ Result: "Failure", message: e.message });
  }
});

//             -------------------ACCESS LEVEL    -----------------

app.post('/add_departments_accesslevel', (req, res) => {
  const { departments } = req.body;  

  // Check if departments array is missing or malformed
  if (!departments || !Array.isArray(departments)) {
    return res.status(400).json({ error: 'Invalid input. Departments array is missing or malformed.' });
  }

  // Iterate over each department and insert into the database
  departments.forEach((department) => {
    const { designation_id, accessLevel, name } = department;

    // Insert department into tbl_department table
    const insertQuery = 'INSERT INTO tblaccess_level_department (designation_id, access_level, department) VALUES (?, ?, ?)';
    con.query(insertQuery, [designation_id, accessLevel, name], (err, result) => {
      if (err) {
        console.error('Error inserting department:', err);
        return res.status(500).json({ error: 'Failed to insert department into database.' });
      }
    });
  });

  res.status(200).json({ message: 'Departments added successfully.' });
});


app.post('/add_divisions_accesslevel', (req, res) => {
  const { divisions } = req.body;  

  // Check if divisions array is missing or malformed
  if (!divisions || !Array.isArray(divisions)) {
    return res.status(400).json({ error: 'Invalid input. Divisions array is missing or malformed.' });
  }

  // Iterate over each division and insert into the database
  divisions.forEach((division) => {
    const { designation_id, accessLevel, name } = division;

    // Insert division into tbl_division table
    const insertQuery = 'INSERT INTO tblaccess_level_division (designation_id, access_level, division) VALUES ( ?, ?, ?)';
    con.query(insertQuery, [ designation_id, accessLevel, name], (err, result) => {
      if (err) {
        console.error('Error inserting division:', err);
        return res.status(500).json({ error: 'Failed to insert division into database.' });
      }
    });
  });

  res.status(200).json({ message: 'Divisions added successfully.' });
});


app.post('/add_classes_accesslevel', (req, res) => {
  const { classes } = req.body;  

  // Check if classes array is missing or malformed
  if (!classes || !Array.isArray(classes)) {
    return res.status(400).json({ error: 'Invalid input. Classes array is missing or malformed.' });
  }

  // Iterate over each class and insert into the database
  classes.forEach((classItem) => {
    const {designation_id, accessLevel, name } = classItem;

    // Insert class into tbl_class table
    const insertQuery = 'INSERT INTO tblaccess_level_classes (designation_id, access_level, class) VALUES (?, ?, ?)';
    con.query(insertQuery, [designation_id, accessLevel, name], (err, result) => {
      if (err) {
        console.error('Error inserting class:', err);
        return res.status(500).json({ error: 'Failed to insert class into database.' });
      }
    });
  });

  res.status(200).json({ message: 'Classes added successfully.' });
});

  

//access level new

app.post('/add_departments_accesslevel', (req, res) => {
  const { departments } = req.body;  

  // Check if departments array is missing or malformed
  if (!departments || !Array.isArray(departments)) {
    return res.status(400).json({ error: 'Invalid input. Departments array is missing or malformed.' });
  }

  // Iterate over each department and insert into the database
  departments.forEach((department) => {
    const { designation_id, accessLevel, name } = department;

    // Insert department into tbl_department table
    const insertQuery = 'INSERT INTO tbl_department (designation_id, access_level, department) VALUES (?, ?, ?)';
    con.query(insertQuery, [designation_id, accessLevel, name], (err, result) => {
      if (err) {
        console.error('Error inserting department:', err);
        return res.status(500).json({ error: 'Failed to insert department into database.' });
      }
    });
  });

  res.status(200).json({ message: 'Departments added successfully.' });
});


app.post('/add_divisions_accesslevel', (req, res) => {
  const { divisions } = req.body;  

  // Check if divisions array is missing or malformed
  if (!divisions || !Array.isArray(divisions)) {
    return res.status(400).json({ error: 'Invalid input. Divisions array is missing.' });
  }

  // Iterate over each division and insert into the database
  divisions.forEach((division) => {
    const { designation_id, accessLevel, name } = division;

    // Insert division into tbl_division table
    const insertQuery = 'INSERT INTO tbl_division (designation_id, access_level, division) VALUES ( ?, ?, ?)';
    con.query(insertQuery, [ designation_id, accessLevel, name], (err, result) => {
      if (err) {
        console.error('Error inserting division:', err);
        return res.status(500).json({ error: 'Failed to insert division into database.' });
      }
    });
  });

  res.status(200).json({ message: 'Divisions added successfully.' });
});


app.post('/add_classes_accesslevel', (req, res) => {
  const { classes } = req.body;  

  // Check if classes array is missing or malformed
  if (!classes || !Array.isArray(classes)) {
    return res.status(400).json({ error: 'Invalid input. Classes array is missing.' });
  }

  // Iterate over each class and insert into the database
  classes.forEach((classItem) => {
    const {designation_id, accessLevel, name } = classItem;

    // Insert class into tbl_class table
    const insertQuery = 'INSERT INTO tbl_class (designation_id, access_level, class) VALUES (?, ?, ?)';
    con.query(insertQuery, [designation_id, accessLevel, name], (err, result) => {
      if (err) {
        console.error('Error inserting class:', err);
        return res.status(500).json({ error: 'Failed to insert class into database.' });
      }
    });
  });

  res.status(200).json({ message: 'Classes added successfully.' });
});


app.get('/studentviewall_access_details', (req, res) => {
  try {
      const id_number = req.params.userid;
      console.log(id_number);

      const sql = `
          SELECT d.id, da.access_level, st.name, st.profile, 
          CONCAT (st.classes, '(', st.division, ')') as division, c.hcr, p.mobile_number, st.dou
          FROM tbldesignation d
          INNER JOIN tblstaff s ON s.designation = d.designation_role AND s.department = d.department
          INNER JOIN tblaccess_level_department da ON da.designation_id = d.id 
          INNER JOIN tblaccess_level_division dd ON dd.designation_id = d.id 
          INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id
          INNER JOIN tblstudent st ON st.classes = dc.classes AND st.division = dd.division
          INNER JOIN tblclasses c ON c.classes_name = st.classes AND c.division = st.division AND c.department = s.department 
          INNER JOIN tblparent p on st.id_number = p.id_number
          WHERE s.id_number = ?`;

      con.query(sql, [id_number], (err, result) => {
          if (err) {
              console.error('Error fetching staff access details:', err);
              return res.status(500).json({ error: 'Internal server error' });
          }

          res.status(200).json(result);
      });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/staffviewall_access_details', (req, res) =>{
   try {
     

      const sql = `
      SELECT  d.id, da.access_level, dc.classes, dd.division
      FROM tblstaff s
      INNER JOIN tbldesignation d ON s.department = d.department AND s.designation = d.designation_role
      INNER JOIN tblaccess_level_department da ON da.designation_id = d.id 
      INNER JOIN tblaccess_level_division dd ON dd.designation_id = d.id 
      INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id
      WHERE s.designation = "principal" AND s.department = "biology";`;

      con.query(sql, (err, result) => {
          if (err) {
              console.error('Error fetching staff access details:', err);
              return res.status(500).json({ error: 'Internal server error' });
          }

          res.status(200).json(result);
      });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});



  
        //---------------------------LOGIN PAGE EMAIL AND PHONE NUMBER-------------------------------------

        app.put('/updateuserprofilepic',  (req, res)=> {
          res.header('Content-Type', 'application/json');
          try {
            const {id} = req.body;
            const profile_base64 = convertImageToBase64(req.body.profile);
             
                  con.connect(function(err) {
                    if (err)  throw err;
                    console.log("Connected!");
                    var sql = `UPDATE tbluser set profile = ? where id=?`;
                    con.query(sql, [profile_base64, id], function(err, result){
                      if (err) throw err;
                      console.log("record updated successfully");
                      res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
                    });
                  });
                  } catch   (ex) {
                    console.error('Error:', ex);
                    res.status(500).json({ Result: "Failure", message: ex.message });
                  }
        });
        
        
          // app.put('/forget_password', (req, res)=> {
          //   res.header('Content-Type', 'application/json');
          //   try {
          //     const {username, password } = req.body;
          //     console.log(username, password);
          //     // Hash the password
          //     const salt = bcrypt.genSaltSync(10);
          //     const hashedPwd = bcrypt.hashSync(password, salt);
        
          //         bcrypt.hash(password, 10, (err, hashedPwd) => {
          //       if (err) {
          //           console.error('Error hashing password:', err);
          //           return res.status(500).json({ error: 'Internal server error' });
          //         }
          //       });
        
          //           // Get a connection from the pool
          //           con.connect(function(err) {
          //             if (err)  throw err;
          //             console.log("Connected!");
          //             var sql = `UPDATE tbluser set  password=? where username=?`;
          //             con.query(sql, [ username, hashedPwd,], function(err, result){
          //               if (err) throw err;
          //               console.log("record updated successfully");
          //               res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
          //             });
          //           });
          //           } catch   (ex) {
          //             console.error('Error:', ex);
          //             res.status(500).json({ Result: "Failure", message: ex.message });
          //           }
                        
          // });
        
        //   app.put('/forget_password', (req, res)=> {
        //     res.header('Content-Type', 'application/json');
        //     try {
        //         const { username, password } = req.body;
        //         console.log(username, password);
                
        //         // Get a connection from the pool
        //         con.connect(function(err) {
        //             if (err) throw err;
        //             console.log("Connected!");
                    
        //             // Update the password in the database
        //             var sql = `UPDATE tbluser SET password=? WHERE username=?`;
        //             con.query(sql, [password, username], function(err, result) {
        //                 if (err) throw err;
        //                 console.log("Record updated successfully");
        //                 res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        //             });
        //         });
        //     } catch (ex) {
        //         console.error('Error:', ex);
        //         res.status(500).json({ Result: "Failure", message: ex.message });
        //     }
        // });
        
        app.get('/viewbyid',async (req, res)=>{
          res.header('Content-Type', 'application/json');
          try {
            const {id}  = req.query;
            // Get a connection from the pool
            con.connect(function(err) {
              if (err) throw err;
              console.log("Connected!");
              var sql = `SELECT * FROM tbluser WHERE id =?`;
                con.query(sql, [id], function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
                res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
              });
            });
        
          } catch   (ex) {
            console.error('Error:', ex);
            res.status(500).json({ Result: "Failure", message: ex.message });
          }
        });


        ////postmancheck for forget password
        
        // app.put('/forget_password', (req, res)=> {
        //   res.header('Content-Type', 'application/json');
        //   try {
        //       const { username, password, id} = req.body;
        //       console.log(username, password, id);
              
        //       // Get a connection from the pool
        //       con.connect(function(err) {
        //           if (err) throw err;
        //           console.log("Connected!");
                  
        //           // Update the password in the database
        //           var sql = `UPDATE tbluser SET password=?, username=? WHERE id=?`;
        //           con.query(sql, [password, username, id], function(err, result) {
        //               if (err) throw err;
        //               console.log("Record updated successfully");
        //               res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        //           });
        //       });
        //   } catch (ex) {
        //       console.error('Error:', ex);
        //       res.status(500).json({ Result: "Failure", message: ex.message });
        //   }
        // });
        
        
        
          // app.post('/verify_mobile_email', (req, res) => {
          //   const { otp, organization_mobile_no, email_id } = req.body;
            
          //   try {
          //     let rows;
              
          //     if (organization_mobile_no) {
          //       rows =  con.query(`SELECT otp FROM tbluser WHERE organization_mobile_no = ?`, [organization_mobile_no]);
          //     } else if (email_id) {
          //       rows =  con.query(`SELECT otp FROM tbluser WHERE email_id = ?`, [email_id]);
          //     } else {
          //       return res.status(400).json({ success: false, message: 'Missing organization_mobile_no or email_id' });
          //     }
          
          //     if (rows.length === 0) {
          //       return res.status(404).json({ success: false, message: 'User not found' });
          //     }
          
          //     if (otp === rows[0].otp) {
          //       return res.json({ success: true, message: 'Login successful', identifier: organization_mobile_no || email_id });
          //     } else {
          //       return res.status(401).json({ success: false, message: 'Invalid OTP' });
          //     }
          //   } catch (error) {
          //     console.error('Error verifying OTP:', error);
          //     return res.status(500).json({ success: false, error: 'Failed to verify OTP' });
          //   }
          // });
         
        
app.post('/forgotpassword', async(req, res) => {
  const { name, email, message } = req.body;

  // Replace these with your actual email and SMTP server details
  var transporter = nodemailer.createTransport( {
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    auth: {
        user: "elanchezhian789@outlook.com",
        pass: "90038elan"
    },
    tls: {
        ciphers:'SSLv3'
    }
});
  const mailOptions = {
      from: 'elanchezhian789@outlook.com',
     // to: 'rockerelan@gmail.com',
      to: email,
      subject: 'Medshyne Contact Us',
      message: message,
      text: `Name: ${name}\nEmail: ${email}\nOTP: ${message}`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Email sent successfully!' });
} catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});
  

app.post('/resetpassword', async(req, res) => {
  const { name, email, message } = req.body;

  // Replace these with your actual email and SMTP server details
  var transporter = nodemailer.createTransport( {
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    auth: {
        user: "elanchezhian789@outlook.com",
        pass: "90038elan"
    },
    tls: {
        ciphers:'SSLv3'
    }
});
  const mailOptions = {
      from: 'elanchezhian789@outlook.com',
     // to: 'rockerelan@gmail.com',
      to: email,
      subject: 'Medshyne Contact Us',
      message: message,
      text: `Name: ${name}\nEmail: ${email}\nOTP: ${message}`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Email sent successfully!' });
} catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

app.post('/saveotp', function (req, res) {
  res.header('Content-Type', 'application/json');
  try {
    const {email,otp}  = req.body;
    // Get a connection from the pool
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql =`Select * from tbluser where email_id = ?`;
        con.query(sql, [email], function (err, result) {
        if (err) throw err;
        console.log("1 selected");
       // res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
       let id =   result[0].id;
       console.log('ID FOR EMAIL',id);
       let sql1 = `UPDATE tbluser SET otp =? WHERE id =?`;
       con.query(sql1, [otp, id], function (err, resultUpdate) {
        if (err) throw err;
        console.log("1 record updated");
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", resultUpdate });
      });
    });
  });
    
  }
  catch (err) {
    console.error('Error:', err);
    res.status(500).json({ Result: "Failure", message: err.message });
  }
});


app.put('/newusername_password', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    const { username, password, id } = req.body;
    console.log(username, password, id);
    
    // Get a connection from the pool
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      
      // Update the password and username in the database based on organization mobile number and email
      var sql = `UPDATE tbluser SET password=?, username=? WHERE id=?`;
      con.query(sql, [password, username, id], function(err, result) {
        if (err) throw err;
        console.log("Record updated successfully");
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

app.get('/username',async (req, res)=>{
    res.header('Content-Type', 'application/json');
    try {
      const {id}  = req.query;
      // Get a connection from the pool
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `SELECT username FROM tbluser WHERE id =?`;
          con.query(sql, [id], function (err, result) {
          if (err) throw err;
          console.log("1 record inserted");
          res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
        });
      });
  
    } catch   (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });
  
  app.get('/getidfromemail', function (req, res) {
    res.header('Content-Type', 'application/json');
    try {
      const {email}  = req.query;
      // Get a connection from the pool
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql =`Select * from tbluser where email_id = ?`;
          con.query(sql, [email], function (err, result) {
          if (err) throw err;
          console.log("1 selected");
         res.status(200).json({ Result: "Success", message: "Data searched Successfully", result });
      });
    });
      
    }
    catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }
  });
  
        
        
        //  app.post('/verify_mobile&email',  (req, res) => {
        //     const { otp, organization_mobile_no, email_id } = req.body;
        //     let otpFromDb ='';
        //     try {
        //         let rows;
                
        //         if (organization_mobile_no) {
        //           console.log('mobile no found');
        //             rows =  con.query(`SELECT otp FROM tbluser WHERE organization_mobile_no = ?`, [organization_mobile_no],function(err, rows) {
        //               if(err)
        //               {
        //                 throw new Error('DAtabase exception occured');
        //               }
        //             console.log(rows[0].otp);
        //             otpFromDb =rows[0].otp;
        //             console.log('otp is ',otp , '  db otp ',otpFromDb);
        //             if (otp ==  otpFromDb)
        //             {
        //                 return res.json({ success: true, message: 'Login successful' });
        //             } else {
        //                 return res.status(401).json({ success: false, message: 'Invalid OTP' });
        //             }         
        //             }) ;
        //            // console.log("Organization Mobile No:", organization_mobile_no);
        //            // console.log("Rows:", rows);
        //         } else if (email_id) {
        //           console.log('email no found');
        //             rows =  con.query(`SELECT otp FROM tbluser WHERE email_id = ?`, [email_id]);
        //             console.log("Email ID:", email_id);
        //             //console.log("Rows:", rows);
        //         } else {
        //             return res.status(400).json({ success: false, message: 'Missing organization_mobile_no or email_id' });
        //         }
        
        //         if (!rows || rows.length === 0) {
        //             return res.status(404).json({ success: false, message: 'User not found' });
        //         }
        
        //         // Check if rows[0] is defined before accessing its properties
            
        //     } catch (error) {
        //         console.error('Error verifying OTP:', error);
        //         return res.status(500).json({ success: false, error: 'Failed to verify OTP' });
        //     }
        // });
        
         
  
            // -------------Inner Join Query-------------

          //   app.get('/students_and_parents', (req, res) => {
          //     con.connect(function (err) {
          //         if (err) throw err;
          //         console.log("Connected!");
          
          //         // Use placeholders in the SQL query to prevent SQL injection
          //         const sql = `SELECT * FROM tblstudent
          //                    INNER JOIN tblparent ON tblstudent.id_number = tblparent.id_number`;
          
          //         // Use parameterized query to avoid SQL injection
          //         con.query(sql, function (err, result) {
          //             if (err) throw err;
          //             console.log("Data fetched successfully");
          //             res.status(200).json({ Result: "Success", data: result });
          //         });
          //     });
          // });

         
      //   app.delete('/delete_student_list', (req, res) => {
      //     res.header('Content-Type', 'application/json');
      
      //     try {
      //         const { id_number } = req.body;
      
      //         if (!id_number) {
      //             return res.status(400).json({ Result: "Failure", message: "Missing required parameter: id_number" });
      //         }
      
      //         con.connect(function (err) {
      //             if (err) throw err;
      
      //             const deleteQuery = `
      //                 DELETE tblclasses, tblstudent, tblparent
      //                 FROM tblclasses
      //                 LEFT JOIN tblstudent ON tblclasses.id_number = tblstudent.id_number
      //                 LEFT JOIN tblparent ON tblstudent.id_number = tblparent.id_number
      //                 WHERE tblclasses.id_number = ?
      //             `;
      
      //             con.query(deleteQuery, [id_number], function (err, result) {
      //                 if (err) {
      //                     console.error('Error executing SQL query:', err);
      //                     res.status(500).json({ Result: "Failure", message: "Failed to delete data" });
      //                 } else {
      //                     if (result.affectedRows > 0) {
      //                         console.log('Data deleted successfully');
      //                         res.status(200).json({ Result: "Success", message: "Data deleted successfully" });
      //                     } else {
      //                         console.log('No matching record found');
      //                         res.status(404).json({ Result: "Failure", message: "No matching record found" });
      //                     }
      //                 }
      //             });
      //         });
      //     } catch (err) {
      //         console.error('Error:', err);
      //         res.status(500).json({ Result: "Failure", message: err.message });
      //     }
      // });
      
      //     SELECT 
      //     c.HCR,
      //     c.last_update,
      //     c.division,
      //     c.department,
      //     s.profile,
      //     s.name,
      //     s.id_number,
      //     hp.mobile_number
      // FROM 
      //     tblclasses c
      // LEFT JOIN 
      //     tblstudent s ON c.id_number = s.id_number
      // LEFT JOIN 
      //     tblparent hp ON s.id_number = hp.id_number;


  //     app.post('/contactus', async(req, res) => {
  //       const { name, email, message } = req.body;
    
  //       // Replace these with your actual email and SMTP server details
  //       var transporter = nodemailer.createTransport( {
  //         host: "smtp-mail.outlook.com", // hostname
  //         secureConnection: false, // TLS requires secureConnection to be false
  //         port: 587, // port for secure SMTP
  //         auth: {
  //             user: "elanchezhian789@outlook.com",
  //             pass: "90038elan"
  //         },
  //         tls: {
  //             ciphers:'SSLv3'
  //         }
  //     });
  //       const mailOptions = {
  //           from: 'elanchezhian789@outlook.com',
  //           to: 'rockerelan@gmail.com',
  //           subject: 'Test new mail',
  //           message: 'Test mail',
  //           text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  //       };
  //       try {
  //         const info = await transporter.sendMail(mailOptions);
  //         console.log('Email sent:', info.response);
  //         res.status(200).json({ message: 'Email sent successfully!' });
  //     } catch (error) {
  //         console.error('Error sending email:', error);
  //         res.status(500).json({ error: 'Internal Server Error' });
  //     }
  // });

// app.get('/get_consulting_api_b', (req, res)=>{
//   res.header('Content-Type', 'application/json');
//   try {
//     const {consult_id}  = req.body;
//     con.connect(function(err) {
//       if (err) throw err;
//       console.log("Connected!");
//       var sql = `SELECT 
//       c.patient_name, c.sick_type, c.consult_id, 
//       CONCAT(c.classes, '/', c.division) AS class_and_division, 
//       DATE_FORMAT(c.date, '%b %e,%Y') AS formatted_date,
//       c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i%p)') AS formatted_from_time,
//       CASE 
//           WHEN p.mobile_number IS NOT NULL THEN p.mobile_number
//           ELSE st.mobile_number 
//       END AS mobile_number, 
//       c.hcr_name, st.id_number AS hcr_id_number
//   FROM 
//       tblconsulting c
//   LEFT JOIN 
//       tblparent p ON c.id_number = p.id_number
//   LEFT JOIN 
//       tblstaff st ON c.hcr_name = st.name
//   LEFT JOIN 
//       tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
//       WHERE 
//     c.status IN ('new','waiting','cancelled')`;
//         con.query(sql, [consult_id], function (err, result) {
//         if (err) throw err;
//         console.log(`${result.length} record(s) retrieved`);

//         // Creating array list
//         const arrayList = result.map(item => ({
//           patient_name: item.patient_name,
//           sick_type: item.sick_type,
//           consult_id: item.consult_id,
//           date: item.formatted_date
//           class_and_division: item.class_and_division
//         }));

//         // Creating another array list (balanceArrayList)
//         const balanceArrayList = result.map(item => ({
//           // Include the fields you want for balance data here
//           // For example:
//           patient_name: item.patient_name,
//           sick_type: item.sick_type,
//           consult_id: item.consult_id,
//           date: item.formatted_date,
//           class_and_division: item.class_and_division,
//           id_number: item.id_number,
//           assignee: item.assignee,
//           mobile_number: item.mobile_number,
//           hcr: item.hcr_name,
//           hcr_id_number: item.hcr_id_number,
//           from_time: item.formatted_from_time

//         }));

//         res.status(200).json({ Result: "Success", message: "Data viewed successfully", arrayList, balanceArrayList });
//       });
//     });

//   } catch   (ex) {
//     console.error('Error:', ex);
//     res.status(500).json({ Result: "Failure", message: ex.message });
//   }
// });


//---hiii
// app.get('/date_filter_a', (req, res) => {
//   res.header('Content-Type', 'application/json');
//   try {
//     const start_date = req.body.start_date; // Start date for the calendar filter
//     const end_date = req.body.end_date; // End date for the calendar filter

//     // Check if start and end dates are provided
//     if (!start_date || !end_date) {
//       return res.status(400).json({
//         result: "failure",
//         message: "Please provide valid start_date and end_date"
//       });
//     }

//     var sql = `
//       SELECT 
//           c.patient_name, c.sick_type, c.consult_id, 
//           CONCAT(c.classes, '/', c.division) AS class_and_division, 
//           DATE_FORMAT(c.date, '%b %e,%Y') AS formatted_date,
//           c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i%p)') AS formatted_from_time,
//           CASE 
//               WHEN p.mobile_number IS NOT NULL THEN p.mobile_number
//               ELSE st.mobile_number 
//           END AS mobile_number, 
//           c.hcr_name, st.id_number AS hcr_id_number
//       FROM 
//           tblconsulting c
//       LEFT JOIN 
//           tblparent p ON c.id_number = p.id_number
//       LEFT JOIN 
//           tblstaff st ON c.hcr_name = st.name
//       LEFT JOIN 
//           tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
//       WHERE 
//       c.status IN ('completed') and 
//           c.date >= ? AND c.date <= ?`;

//     con.query(sql, [start_date, end_date], function (err, result) {
//       if (err) throw err;
//       console.log("1 record inserted");

//       const data = result.map(row => ({
//         patient_name: row.patient_name,
//         sick_type: row.sick_type,
//         consult_id: row.consult_id,
//         class_and_division: row.class_and_division,
//         date: row.formatted_date
//       }));

//       const data1 = result.map(row => ({
//         id_number: row.id_number,
//         consult_id: row.consult_id,
//         mobile_number: row.mobile_number,
//         hcr: row.hcr,
//         assignee: row.assignee,
//         hcr_id_number: row.hcr_id_number,
//         from_time: row.formatted_from_time,
//       }));

//       console.log(`${result.length} record(s) retrieved`);
//       res.status(200).json({ Result: "Success", message: "Data viewed successfully", data, data1 });
//     });
//   } catch (ex) {
//     console.error('Error:', ex);
//     res.status(500).json({ Result: "Failure", message: ex.message });
//   }
// });



// app.post('/loginusertoken', (req, res) => {
//   res.header('Content-Type', 'application/json');
//   try {
//       const { username, password } = req.body;
//       // Get a connection from the pool
      
//           console.log("Connected to database!");
//           const sql = `SELECT * FROM tbluser WHERE username = ?`;
//           con.query(sql, [username], (err, result) => {
//               if (err) {
//                   console.error('Error executing SQL query:', err);
//                   res.status(500).json({ Result: "Failure", message: "Internal server error" });
//                   return;
//               }
//               if (result.length > 0) {
//                   if (result[0].password === password) {
//                       console.log("Login successful");
//                       const token = jwt.sign({ userId: result[0].id, username: result[0].username, organization_name: result[0].organization_name }, '605001', { expiresIn: '1h' });

//                       // Include user ID in the response
//                       res.status(200).json({ userId: result[0].id, username: result[0].username, organization_name: result[0].organization_name, token, Result: "Success", message: "Login successful" });

//                       // Insert or update organization_name into tblstaff
//                       const organization_name = result[0].organization_name;
//                       const updateSql = `INSERT INTO tblstaff (username, organization_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE organization_name = ?`;
//                       con.query(updateSql, [username, organization_name, organization_name], (err, result) => {
//                           if (err) {
//                               console.error('Error updating tblstaff:', err);
//                               // Handle error if necessary
//                           } else {
//                               console.log('Organization name updated in tblstaff');
//                           }
//                       });
//                   } else {
//                       console.log("Login failed: Incorrect password");
//                       res.status(401).json({ Result: "Failure", message: "Login failed: Incorrect password" });
//                   }
//               } else {
//                   console.log("Login failed: User not found");
//                   res.status(401).json({ Result: "Failure", message: "Login failed: User not found" });
//               }
//               // Release the connection back to the pool
//               // con.release();
//           });
      
//   } catch (err) {
//       console.error('Error:', err);
//       res.status(500).json({ Result: "Failure", message: err.message });
//   }
// });


//consulting count of records
app.get('/consulting_count_records', (req, res) => {
  con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      // Use placeholders in the SQL query to prevent SQL injection
      var sql = "SELECT COUNT(*) AS recordCount FROM tblconsulting";

      // Use parameterized query to avoid SQL injection
      con.query(sql, function (err, result) {
          if (err) throw err;

          const recordCount = result[0].recordCount;
          console.log(`Total records count: ${recordCount}`);

          res.status(200).json({ Result: "Success", recordCount });
      });
  });
});
app.get('/student_count_records', (req, res) => {
  con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      // Use placeholders in the SQL query to prevent SQL injection
      var sql = "SELECT COUNT(*) AS recordCount FROM tblstudent";

      // Use parameterized query to avoid SQL injection
      con.query(sql, function (err, result) {
          if (err) throw err;

          const recordCount = result[0].recordCount;
          console.log(`Total records count: ${recordCount}`);

          res.status(200).json({ Result: "Success", recordCount });
      });
  });
});


app.get('/designation_dropdown', (req, res) => {
  try {
    const getAlldesignation = "SELECT distinct designation_role FROM tbldesignation";

    // Query the database
    con.query(getAlldesignation, (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        return res.status(500).json({ Result: "Failure", message: "Internal server error" });
      }
      //single array mapping
      const alldesignation = result.map(record => record.designation_role);

      // Send the names as a JSON response
      res.status(200).json({
        Result: "Success",
        message: "All designation retrieved successfully",
        data: alldesignation
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});



app.post('/logout', (req, res) => {
  // Clear the token from client storage (e.g., local storage or cookies)
  res.clearCookie('jwt_token'); // Assuming token is stored in a cookie named 'jwt_token'

  res.status(200).json({
    Result: "Success",
    message: "Logout Successful"
  });
});

//-----------------------------------
//-----------------------------------
//------------------------------------ HCR APP api ------------------

app.post('/hcr_login', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
      const { id_number, password } = req.body;
      // Get a connection from the pool
      con.connect(function (err) {
          if (err) throw err;
          console.log("Connected!");
          var sql = `SELECT * FROM tblstaff WHERE id_number = ?`;
          con.query(sql, [id_number], function (err, result) {
              if (err) throw err;
              if (result.length > 0) {
                  if (result[0].password === password) {
                      console.log("Login successful");
                      const token = jwt.sign({ userId: result[0].id, id_number: result[0].id_number, organization_name: result[0].organization_name }, '605001', { expiresIn: '1h' });

                      // Include user ID in the response
                      res.status(200).json({ userId: result[0].id, id_number: result[0].id_number, organization_name: result[0].organization_name, token, Result: "Success", message: "Login successful" });
                  } else {
                      console.log("Login failed: Incorrect password");
                      res.status(401).json({ Result: "Failure", message: "Login failed: Incorrect password" });
                  }
              } else {
                  console.log("Login failed: User not found");
                  res.status(401).json({ Result: "Failure", message: "Login failed: User not found" });
              }
          });
      });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
  }
});

app.get('/view_hcr_profile',async (req, res)=>{
  res.header('Content-Type', 'application/json');
  try {
    const {id_number}  = req.query.id_number;
    // Get a connection from the pool
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `SELECT profile,name,id_number,department,designation,gender,dob,blood_group FROM tbluser WHERE id_number =?`;
        con.query(sql, [id_number], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
      });
    });

  } catch   (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

  app.listen(5000);
  console.log("Server running on port 5000:");
  console.log("Press Ctrl+C to quit.");
