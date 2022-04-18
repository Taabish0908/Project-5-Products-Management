const userModel = require('../models/userModel');
const s3link = require("../cloud link/s3link")
const bcrypt = require('bcrypt')
const saltRounds = 10;
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')

// ........................Validation Functions..........................................

const isValid = function (value) {
    if (typeof value == undefined || value == null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
};

const isvalidStringOnly = function (value) {
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

// ...........................Ist Api Create/Register User................................................................


const createUser = async function (req, res) {
    try {
        const data = req.body
        // let { fname, lname, email, password, phone, address, profileImage } = data
        let { fname, lname, email, password, phone, address } = data /*Destructring method*/
        let files = req.files
        let profileImage


        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "please provide Data" })
        }
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname required" })
        }
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname required" })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "email required" })
        }
        const DuplicateEmail = await userModel.findOne({ email:email });
        if (DuplicateEmail) {
            return res.status(400).send({ status: false, message: "This email Id already exists with another user" });
        }
        if (!/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(data.email)) {
            return res.status(400).send({ status: false, message: "Please provide a valid email" });
        }
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "password required" })
        }
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "phone required" })
        }
        const duplicatePhone = await userModel.findOne({ phone:phone })
        if (duplicatePhone) {
            return res.status(400).send({ status: false, message: "This phone number already exists with another user" });
        }
        if (!/^([+]\d{2})?\d{10}$/.test(phone.trim())) {
            return res.status(400).send({ status: false, message: 'Phone number not valid, please provide valid indian phone number' });
        }
        // if (!isValid(address)) {
        //     return res.status(400).send({ status: false, message: "address required" })
        // }
        if (!isValid(address.shipping.street)) {
            return res.status(400).send({ status: false, message: "Shipping street required" })
        }
        if (!isValid(address.shipping.city)) {
            return res.status(400).send({ status: false, message: "Shipping city required" })
        }
        if (!isValid(address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Shipping Pincode required" })
        }
        if (!/^([+]\d{2})?\d{6}$/.test(address.shipping.pincode.trim())) {
            return res.status(400).send({ status: false, message: 'Shipping PinCode not valid, please provide 6 Digit valid pinCode' });
        }
        if (!isValid(address.billing.street)) {
            return res.status(400).send({ status: false, message: "billing street required" })
        }
        if (!isValid(address.billing.city)) {
            return res.status(400).send({ status: false, message: "billing city required" })
        }
        if (!isValid(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "billing Pincode required" })
        }
        if (!/^([+]\d{2})?\d{6}$/.test(address.billing.pincode.trim())) {
            return res.status(400).send({ status: false, message: 'Billing PinCode not valid, please provide 6 Digit valid pinCode' });
        }


        // if (!isValid(profileImage)) {
        //     return res.status(400).send({ status: false, message: "profileImage required" })
        // }

        // password validation for character between 8 to 15.

        if (!(password.trim().length >= 8 && password.trim().length <= 15)) {
            return res.status(400).send({ status: false, message: "Please provide password with min 8 and max 14 characters" });;
        }
        if (!files.length > 0) { return res.status(400).send({ status: false, msg: "please provide profile image" }) }


        //  for uploading the profile image in S3

        profileImage = await s3link.uploadFile(files[0])


        // for checking the duplicate values for phone number & E-mail

        
        

        // creating encrypted Password

        hash = bcrypt.hashSync(password, saltRounds);  /* using bcrypt with 2 arguments pass & saltrounds as 10*/
        console.log(password)

        const userData = {
            fname,
            lname,
            profileImage,
            email,
            password: hash,
            phone,
            address

        }

        const savedUser = await userModel.create(userData);
        res.status(201).send({ status: true, message: 'User Registered', data: savedUser });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

// ....................Second Api User Login........................................................


const userLogin = async function (req, res) {

    try {
        const data = req.body
        const { email, password } = data
        let query = req.query
        if (isValidRequestBody(query)) {
            return res.status(400).send({ status: false, message: 'this is not allowed' })
        }

        if (!data) {
            return res.status(400).send({ status: false, message: "please input Some Data" })
        }

        if (!isValid(email)) {
            return res.status(401).send({ status: false, message: "please input valid emailId" })
        }

        if (!isValid(password)) {
            return res.status(401).send({ status: false, message: "please input valid password" })
        }

        const user = await userModel.findOne({ email: email })
        if (user) {
            const decryptedPassword = await bcrypt.compareSync(data.password, user.password);
            console.log(decryptedPassword)

            if (decryptedPassword) {
                const userID = user._id
                const payLoad = { userId: userID }
                const secretKey = "group2project3almostdone"

                // creating JWT

                const token = jwt.sign(payLoad, secretKey, { expiresIn: "1hr" })

                // res.header("group2", token)

                return res.status(200).send({ status: true, message: "login successful", data: { userId: user._id, token } })

            } else {
                res.status(401).send({ status:false,message: "Password is not correct" });
            }

        } else {
            return res.status(400).send({ status: false, message: "mail id is not valid" });
        }


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}




const getUser = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) { 
            return res.status(400).send({ status: false, msg: "invalid userId format" }) }
        let getUser = await userModel.findById(userId)
        if (!getUser) { 
            return res.status(404).send({ status: false, msg: "no user with this Id found" }) }
        res.status(200).send({ status: true, msg: "sucess", data: getUser })



    }

    catch (err) { res.status(500).send({ status: false, error: err.message }) }

}

const updateUser = async function (req, res) {
    // try {

        // let userId = req.params.userId
        // let updateFeild={}
        
        // if (!isValidObjectId(userId)) {
        //      return res.status(400).send({ status: false, msg: "invalid userId format" }) }
        // let checkUserId = await userModel.findById(userId)
        // if (!checkUserId) { 
        //     return res.status(404).send({ status: false, msg: "userId not found" }) }

        // let data = req.body
        // let files = req.files
        // if (!(isValidRequestBody(data) || (files))) { return res.status(400).send({ status: false, msg: "please give some data to update" }) }
        // let { fname, lname, email, password, phone, address, } = data



        // if (!isvalidStringOnly(fname)) { 
        //     return res.status(400).send({ status: false, msg: "please give fname" }) }
        // if(isValid(fname)){
        //     updateFeild['fname']=fname
        // }

        // if (!isvalidStringOnly(lname)) {
        //      return res.status(400).send({ status: false, msg: "please give lname" }) }
        // if(isValid(lname)){
        //     updateFeild['lname'] = lname
        // }



        // if (!isvalidStringOnly(password)) { 
        //     return res.status(400).send({ status: false, msg: "please give password" }) }




        //    if(!isvalidStringOnly(profileImage)){return res.status(400).send({status:false,msg:"please provide image"})}


        // if (!isvalidStringOnly(email)) { 
        //     return res.status(400).send({ status: false, msg: "please give emaill" }) }
        // if (email) {
        //     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        //         return res
        //             .status(400)
        //             .send({ status: false, msg: `Invalid email address!` });
        //     }

        //     let checkDuplicateemail = await userModel.findOne({ email })
        //     if (checkDuplicateemail) { return res.status(400).send({ status: false, msg: "this email is already registred" }) }
        //     updateFeild['email'] = email
        // }



        // if (!isvalidStringOnly(phone)) { return res.status(400).send({ status: false, msg: "please provide phone number" }) }
        // if (phone) {
        //     if (!/^([+]\d{2})?\d{10}$/.test(phone)) {
        //         return res
        //             .status(400)
        //             .send({ status: false, msg: "please provide a valid phone Number" });
        //     }

        //     const duplicatePhone = await userModel.findOne({ phone })
        //     if (duplicatePhone) {
        //         return res.status(400).send({ status: false, message: "This phone number already exists with another user" });
        //     }
        //     updateFeild['phone'] = phone
        // }


        // let profileImage
        // if (files) {
        //     if (files.length > 0) {
        //        const profileImage = await s3link.uploadFile(files[0])
        //        updateFeild['profileImage'] = profileImage
        //     }
        // }

        // let hash
        // if (password) {
        //     const hash = bcrypt.hashSync(password, saltRounds);
        //     updateFeild['password'] = hash}
        

        // if(address){
            // let shippingStreet = address.shipping.street
            // let shippingCity = address.shipping.city
            // let shipping=address.shipping.pincode
            // if(address.shipping){
            //     if(address.shipping.street){
            //         updateFeild["address.shipping.street"]= address.shipping.street}
            // if(address.shipping.city){
            //     updateFeild["address.shipping.city"] = address.shipping.city}
            //     if(address.shipping.pincode){
            //         updateFeild["address.shipping.pincode"] = address.shipping.pincode
            //         if (!/^([+]\d{2})?\d{6}$/.test(address.shipping.pincodes)) {
            //             res.status(400).send({ status: false, message: 'Shipping PinCode not valid, please provide 6 Digit valid pinCode' });
            //         }

            //     } 
            // }
                
                

                // if(address.billing){
                //     if(address.billing.street){
                //         updateFeild["address.billing.street"] = address.billing.street
                //     }
                //     if(address.billing.city){
                //         updateFeild["address.billing.city"] = address.billing.city
                //     }
                //     if(address.billing.pincode){
                //         updateFeild["address.billing.pincode"] = address.billing.pincode
                //         if (!/^([+]\d{2})?\d{6}$/.test(address.billing.pincode)) {
                //         res.status(400).send({ status: false, message: 'Billing PinCode not valid, please provide 6 Digit valid pinCode' });
                //         }
                //     }
                    
    
                // }
        

        // const userData = {
        //     fname,
        //     lname,
        //     profileImage,
        //     email,
        //     password: hash,
        //     phone,
        //     "address.shipping.street":address.shipping.street,
        //     "address.shipping.city":address.shipping.city,
        //     "address.shipping.pincode":address.shipping.pincode,
        //     "address.billing.street":address.billing.street,
            // "address.billing.city":address.billing.city,
            // "address.billing.pincode":address.billing.pincode


        // }


        // if (!isvalidStringOnly(address)) { 
        //     return res.status(400).send({ status: false, msg: "please provide address" }) }
        // let updatedUser = await userModel.findOneAndUpdate({_id: userId }, updateFeild, { new: true })
        // res.status(200).send({ status: true, msg: "updated sucessfully", data: updatedUser })

    // }
    // catch (err) { res.status(500).send({ status: false, error: err.message }) }
// }
try{

    const userId = req.params.userId
  
  if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, msg: "userId is invalid" })
  }
  checkuser=await userModel.findById(userId)
  if(!checkuser){return res.status(404).send({status:true,msg:"user with this id not found"})}
  let { fname, lname, email, phone, password, address } = req.body
  let file = req.files
  const dataObject = {};
  if (!(isValidRequestBody(req.body) || (file))) {
      return res.status(400).send({ status: false, msg: "enter data to update" })
  }
  if (isValid(fname)) {
      dataObject['fname'] =fname
  }
  if (isValid(lname)) {
      dataObject['lname'] = lname
  }
  if (isValid(email)) {
      let findMail = await userModel.findOne({ email: email })
      if (findMail) {
          return res.status(400).send({ status: false, msg: "this email is already register" })
      }
      dataObject['email'] = email
  }
  if (isValid(phone)) {
      let findPhone = await userModel.findOne({ phone: phone })
      if (findPhone) {
          return res.status(400).send({ status: false, msg: "this mobile number is already register" })
      }
      dataObject['phone'] = phone
  }
  if (isValid(password)) {
      if (!password.length >= 8 && password.length <= 15) {
          return res.status(400).send({ status: false, msg: "password length should be 8 to 15" })
      }
      let saltRound = 10
      const hash = await bcrypt.hash(password, saltRound)
      dataObject['password'] = hash
  }
  
  if (file.length > 0) {
      let uploadFileUrl = await s3link.uploadFile(file[0])
      dataObject['profileImage'] = uploadFileUrl
  }

  if (address) {
      
      if (address.shipping) {
          if (address.shipping.street) {

              dataObject['address.shipping.street'] = address.shipping.street
          }
          if (address.shipping.city) {

              dataObject['address.shipping.city'] = address.shipping.city
          }
          if (address.shipping.pincode) {
            //   if (typeof address.shipping.pincode !== 'number') {
                
            //       return res.status(400).send({ status: false, message: 'please enter pinCode in digit' })
            //   }
              if(!/(^[0-9]{6}(?:\s*,\s*[0-9]{6})*$)/.test(address.shipping.pincode)){
               return res.status(400).send({status:false, msg:`pincode six digit number`})
              }
             // console.log(Object.keys(address.shipping.pincode).join(" "))
              dataObject['address.shipping.pincode'] = address.shipping.pincode
              
          }
          
      }

      if (address.billing) {
          if (address.billing.street) {

              dataObject['address.billing.street'] = address.billing.street
          }
          if (address.billing.city) {

              dataObject['address.billing.city'] = address.billing.city
          }
          if (address.billing.pincode) {
            //   if (typeof address.billing.pincode !== 'number') {
            //       return res.status(400).send({ status: false, message: ' Please provide pincode in number' })
            //   }
              if(!/(^[0-9]{6}(?:\s*,\s*[0-9]{6})*$)/.test(address.billing.pincode)){
                return res.status(400).send({status:false, msg:`pincode six digit number`})
               }
              dataObject['address.billing.pincode'] = address.billing.pincode
          }
      }
  }
  const updateProfile = await userModel.findOneAndUpdate({_id:userId }, dataObject , { new: true })
  if (!updateProfile) {
      return res.status(404).send({ status: false, msg: "user profile not found" })
  }
  return res.status(200).send({ status: true, msg: "User Profile updated", data: updateProfile })

}
catch(err){res.status(500).send({status:false,error:err.message})}
}

module.exports.createUser = createUser
module.exports.userLogin = userLogin
module.exports.getUser = getUser
module.exports.updateUser = updateUser