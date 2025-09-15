const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/***********************************\
|******* Register controller *******|
\***********************************/
const registerUser = async(req, res) => {
  try {
    // extract user information from our request body;
    const { username, email, password, role } = req.body;
    
    // Check if user is already exists in our database:
    const checkExistingUser = await User.findOne({$or: [{username}, {email}]});
    if(checkExistingUser) {
      return res.status(400).json({
        success: false,
        message: `User with this username or email already exists!`,
      })
    } 
    //TODO 👉🏽 ******* hash user password: run "npm i bcryptjs" *******
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create a new user and save in your database:
    const newlyCreatedUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
    }) 

    await newlyCreatedUser.save();

    if(newlyCreatedUser) {
      res.status(201).json({
        status: true,
        message: `User with username ${username} and email ${email} registered successfully!`,
        //user: newlyCreatedUser,
      })
    } else {
      res.status(400).json({
        status: false,
        message: `Unable to register user. Please try again!`,
      })
    }
  } catch (err) {
    console.log(err);
    res.statuss(500).json({
      success: false,
      message: `Some error occured! Please try again.`,
    })
  }
}


/*******************************\
|******* Login controller *******|
\*******************************/

const loginUser = async(req, res) => {
  try {
    const { username, password } = req.body;

    // Find if current user exists in our database
    const user = await User.findOne({ username });

    //Validate both username and password have been provided:
    if(!user || !password){
      return res.status(400).json({
        success: false,
        message: `Invalid credentials! User not found!`
      })
    }

    // Compare whether the password is correct:
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if(!isPasswordMatch){
      return res.status(400).json({
        success: false,
        message: `Invalid credentials! Password is incorrect!`
      })
    }

    //TODO 👉🏽 Generate Token: run "npm i jsonwebtoken"
    const accessToken = jwt.sign({
      userId: user._id,
      username: user.username,
      role:  user.role,
    }, process.env.JWT_SECRET_KEY, {expiresIn: '5m'});

    res.status(200).json({
      success: true,
      message: `Logged in successfully!`,
      accessToken,
    })
  } catch (err) {
    console.log(err);
    res.statuss(500).json({
      success: false,
      message: `Some error occured! Please try again.`,
    })
  }
}

/******************************************\
|******* Change Password controller *******|
\******************************************/
const changePassword = async(req, res) => {
  try {
    // ✅ 1. Get userId:
    const userId = req.userInfo.userId;

    // ✅ 2. Get/extract old password: 
    const { oldPassword, newPassword } = req.body;
    /* 
      ➡️ There must be a frontend validation for old password and new password are different. ✨✨✨
    */
    if(oldPassword === newPassword){
      return res.status(400).json({
        success: false,
        message: "New password must be different! Please try again."
      })
    }

    // ✅ 3. find the current logged in user:
    const user = await User.findById(userId);
    if(!user){
      return res.status(400).json({
        success: false,
        message: "User not found!"
      })
    }

    // ✅ 4. check if entered old password is correct:
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if(!isPasswordMatch){
      res.status(400).json({
        success: false,
        message: "Old password is not correct! Please try again."
      })
    }

    // ✅ 5. hash the new password:
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // ✅ 6. update the new password in the database:
    user.password = newHashedPassword;
    await user.save();

    // ✅ 7. send the response:
    res.status(200).json({
      success: true,
      message: "🔐 Password changed successfully! 🎉 "
    })

  }catch(e){
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured! Please try again."
    })
  }
}

module.exports = {
  registerUser,
  loginUser,
  changePassword
}