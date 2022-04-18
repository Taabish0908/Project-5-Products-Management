const productModel = require('../models/productModel');
const s3link = require('../cloud link/s3link')
const mongoose=require('mongoose')


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


const createProduct = async function(req,res){
    try {
         data = req.body
        let files=req.files
        let productImage
        if(!isValidRequestBody(data)){
            return res.status(400).send({status:false,message:'Please provide data for product to create'})
        }

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments }=data

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
            return res.status(400).send({status:false,message:'Only INR is valid for currency type'})

        }
        if(currencyFormat!="₹"){
            return res.status(400).send({status:false,message:'currency format should be indian rupees ₹'})
        }
        if(!isValid(currencyFormat)){
            return res.status(400).send({status:false,message:'please provide currencyformat of the product'})
        }
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
  
        if(!files.length>0){return res.status(400).send({status:false,msg:"please provide product image"})}

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

const getProduct = async function(req,res){
    try {
        let query = req.query
        let {size,name,priceGreaterThan,priceLessThan } = query
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
        

        
        let getProductDetail =await productModel.find(filter)
        return res.status(200).send({status:true,messsage:'sucess',Data:getProductDetail})
        
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
        
    }

}

const getProductById =async function (req,res){
      
    try {
     const productId = req.params.productId
      
  
     if(!productId){
       return res.status(400).send({status:false,message:"product id is required field"})
     }
   if(!isValidObjectId(productId)){
     return res.status(400).send({status:false,message:"Sorry!!! the given product id is invalid Id"})
   }
   checkId = await productModel.findById({_id:productId})
  
  if(!checkId){return res.status(404).send({status:false,msg:"no data with this id found"})}
  console.log(checkId)
    if(checkId.isDeleted==true){return res.status(400).send({status:false,msg:"deleted data"})}
  
  res.status(200).send({status:true,msg:"sucess",data:checkId})
      
    } catch (error) {
      return res.status(500).send({status:false,message:error.message})
    }
   };


   const updateProduct = async function (req, res) {
    try {
      let productId = req.params.productId;
  
      if (!isValidObjectId(productId)) {
        return res.status(400).send({ status: false, msg: "invalid objectid" });
      }
      let checkidinDb=await productModel.findById(productId)
  
      if(!checkidinDb){return res.status(404).send({status:false,msg:"this id is not found"})}
  
      if (!checkidinDb.isDeleted == false) {
        return res.status(404).send("This product Already Deleted");
       }


       
  let data=req.body
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