const productModel = require('../models/productModel');
const s3link = require('../cloud link/s3link')
const mongoose=require('mongoose')

// .......................Validation Functions..............................................................

const isValid = function (value) {
    if (typeof value == undefined || value == null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

// const isvalidSizes = function (title) {
//     return ["S", "XS","M","X", "L","XXL", "XL"].indexOf(title) !== -1
// }

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
  };

  const isvalidStringOnly = function (value) {
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};


// ............................Fifth Api Product Creation..................................................

const createProduct = async function(req,res){
    try {
         data = req.body
        let files=req.files
        let productImage
        if(!isValidRequestBody(data)){
            return res.status(400).send({status:false,message:'Please provide data for product to create'})
        }

        // Using the Destructring Method here

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments }=data

        // validations

        if(!isValid(title)){
            return res.status(400).send({status:false,message:'please provide title of the product'})
        }
        if(!isValid(description)){
            return res.status(400).send({status:false,message:'please provide description of the product'})
        }
        if(!isValid(price)){
            return res.status(400).send({status:false,message:'please provide price of the product'})
        }
        if(!isValid(currencyId)){
            return res.status(400).send({status:false,message:'please provide curencyId of the product'})
        }
        if(currencyId!="INR"){
            return res.status(400).send({status:false,message:'Sorry!!! Only INR is valid for currency type'})

        }
        if(currencyFormat!="₹"){
            return res.status(400).send({status:false,message:'Sorry!!! currency format should be indian rupees ₹'})
        }
        if(!isValid(currencyFormat)){
            return res.status(400).send({status:false,message:'please provide currencyformat of the product'})
        }

        // validation for available size, & for adding multiple size in the form Data
        if (availableSizes) {
          availableSizes=availableSizes.split(",")
          for(let i=0;i<availableSizes.length;i++){
          if (!["S", "XS","M","X", "L","XXL", "XL"].includes(availableSizes[i])) {
            res.status(400).send({
              status: false,
              message: "Sorry!!! Please provide from the available size only",
            });
            return;
          }
        }}

        // checking for the file length, which should not be equal to zero
  
        if(!files.length>0){
          return res.status(400).send({status:false,msg:"please provide product image"})}

        productImage=await s3link.uploadFile(files[0])
        let productData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            productImage,
            style,
            availableSizes,
            installments

        }


        const product =await productModel.create(productData);
        return res.status(201).send({status:true,message:'sucess, product is created',data:product})
        
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
        
    }

}

// ........................Sixth Api Get Product...........................................................

const getProduct = async function(req,res){
    try {
        let query = req.query

        // using Destructing method here
        let {size,name,priceGreaterThan,priceLessThan ,priceSort } = query

        /* this empty object also called hash map will store the particular data when used
        The Map object holds key-value pairs and remembers the original insertion order of the keys. 
        Any value (both objects and primitive values) may be used as either a key or a value.*/

        const filter = { isDeleted: false }

        if(size){
            filter['availableSizes'] = size
        }
        if(name){
            filter['title'] ={$regex:name} /* $regex Provides the regular expression capabilities for pattern
                                             matching strings in queries*/

        }
        if(priceGreaterThan){
            filter['price'] = {$gt:priceGreaterThan} 

        }
        if(priceLessThan){
            filter['price'] = {$lt:priceLessThan}
        }
        // if(priceSort){
        //   if(priceSort == -1 || priceSort==1){
        //     filter['priceSort'] = priceSort 
        //   } else{return res.status(400).send({status:false,message:'provide correct priceSort values'})}
        // }
        

        //  passing/using the map in the find query to filter/store the particular feild

        let getProductDetail =await productModel.find(filter).sort({price:-1})
        return res.status(200).send({status:true,messsage:'sucess',Data:getProductDetail})
        
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
        
    }

}

// .........................Seveth Api Get Product by Id......................................................

const getProductById =async function (req,res){
      
    try {
     const productId = req.params.productId

      //Few Validations 
  
     if(!productId){
       return res.status(400).send({status:false,message:"product id is required field"})
     }
   if(!isValidObjectId(productId)){
     return res.status(400).send({status:false,message:"Sorry!!! the given product id is invalid Id"})
   }
   checkId = await productModel.findById({_id:productId})
  
  if(!checkId){
    return res.status(404).send({status:false,message:"Sorry!!! No data with this id found"})}
  console.log(checkId)

    if(checkId.isDeleted==true){
      return res.status(400).send({status:false,message:"Sorry the said data is deleted/Not avilable"})}
  
  res.status(200).send({status:true,message:"Sucess",data:checkId})
      
    } catch (error) {
      return res.status(500).send({status:false,message:error.message})
    }
   };


  //  .........................Eight Api Update the Product......................................................


   const updateProduct = async function (req, res) {
    try {
      let productId = req.params.productId;
  
      if (!isValidObjectId(productId)) {
        return res.status(400).send({ status: false, message: "Sorry!!! the Object id is not valid" });
      }
      let checkidinDb=await productModel.findById(productId)
  
      if(!checkidinDb){
        return res.status(404).send({status:false,message:"Sorry!!! this id is not found"})}
  
      if (!checkidinDb.isDeleted == false) {
        return res.status(404).send("Sorry!!! This product Already Deleted");
       }


       
  let data=req.body

  // Using Destructiing Method
      let {title,description,price,isFreeShipping,availableSizes,installments}=data
  
      let files=req.files
  
      
      if(!(isValidRequestBody(data)||(files))){
          return res.status(400).send({status:false,msg:"please give some data to update"})}
  
  
      if (!isvalidStringOnly(title)) {
        return res.status(400).send({status:false,msg:"please give title"})
      }
      const titleAlreadyUsed = await productModel.findOne({ title:title });
      if (titleAlreadyUsed) {
       return res.status(400).send("tittle alerady exist");
        
      }
      if (!isvalidStringOnly(description)) {
  
      return res.status(400).send({ status: false, msg: "description is required for updation" });
      
      }
  
      if (!isvalidStringOnly(price)) {
        
          
         return res.status .send({ status: false, msg: "price is required for updation" })}
  
         if(price){
          var z1 = /^[0-9]*$/;
      if (!z1.test(price)) 
      {return res.status(400).send({status:false,msg:"price takes number only"})}
      }
      
      
      if (!isvalidStringOnly(isFreeShipping)) {
        res
          .status(400)
          .send({ status: false, msg: "isfreeshipping is required for updation" });
        return;
      }
  
      if (!isvalidStringOnly(availableSizes)) {
  
        return res.status(400).send({ status: false, msg: "availableSizes is required for updation" });
        
        }
  
        // if(availableSizes){if(!isvalidSizes(availableSizes)){
        //     return res.status(400).send({status:false,msg:"invalid size"})}}
        if (availableSizes) {
          availableSizes=availableSizes.split(",")
          for(let i=0;i<availableSizes.length;i++){
          if (!["S", "XS","M","X", "L","XXL", "XL"].includes(availableSizes[i])) {
            res.status(400).send({
              status: false,
              msg: "invalid sizes",
            });
            return;
          }
        }}
  
  
        if (!isvalidStringOnly(installments)) {
  
          return res.status(400).send({ status: false, msg: "installments is required for updation" });
          
          }
  
          if(installments){
            var z1 = /^[0-9]*$/;
        if (!z1.test(installments)) 
        {return res.status(400).send({status:false,msg:"installments takes number only"})}
        }
      
      
      
      
      if (!checkidinDb.isDeleted == false) {
       return res.status(404).send("This product Already Deleted");
      }
  
      let productImage
  if(files){
  if(files.length>0){
    productImage = await s3link.uploadFile(files[0])}}
  
      
      
      let updateProduct = await productModel.findOneAndUpdate(
        { _id:productId, isDeleted: false },
        data,
        { new: true }
      );
      res.status(201).send({status:false,msg:"updated sucessfully",data:updateProduct})
    } catch (error) {
      res.status(500).send({ satus: false, msg: error.message });
    }
  };

// ...........................Ninth Api Delete by Id....................................................



   const deleteByid = async function(req,res){

    try {
      const productId = req.params.productId
  
      if(!productId){
        return res.status(400).send({status:false,message:"product id is required field"})
      }
    if(!isValidObjectId(productId)){
      return res.status(400).send({status:false,message:"invalid Id"})
    }
 checkId = await productModel.findById({_id:productId})
 
 if(!checkId){return res.status(404).send({status:false,message:"no data with this id found"})}
 
   if(checkId.isDeleted==true){return res.status(400).send({status:false,messgae:"deleted data"})}
 
 
     
 
    const deletebyid = await productModel.findByIdAndUpdate({_id:productId},{isDeleted:true},{new:true})
    res.status(200).send({status:false,msg:"sucess",data:deletebyid})
  
 
     
      
    } catch (error) {
      return res.send(500).send({status:false,message:error.message})
    }
  }

module.exports.createProduct=createProduct
module.exports.getProduct=getProduct
module.exports.getProductById=getProductById
module.exports.updateProduct=updateProduct
module.exports.deleteByid=deleteByid