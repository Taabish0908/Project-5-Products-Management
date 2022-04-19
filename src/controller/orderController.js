let orderModel = require("../models/OrderModel")
const userModel = require('../models/userModel')
let mongoose = require('mongoose');
const cartModel = require('../models/cartModel')
const productModel = require("../models/productModel");


//..................................Validation Function...........................................

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
};
isvalidRequesbody = function (requestbody) {
    if (Object.keys(requestbody).length > 0) {
        return true;
    }
}

const isValid = function (value) {
    if (typeof value === "undefined" || typeof value == "null") {
        return false;
    }

    if (typeof value === "string" && value.trim().length > 0) {
        return true;
    }

    if (typeof value === ("object") && Object.keys(value).length > 0) {
        return true;
    }
};


const isvalidStatus = function (value) {
    return ["pending", "completed", "canceled"].indexOf(value) !== -1
}


// ...........................Fourteenth Api Order Creation....................................

let createOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Sorry!!! The given user id is not valid" })
        }
        let userExist = await userModel.findById(userId)

        if (!userExist) {
            return res.status(404).send({ status: false, message: "Sorry!!! user with this userId not found" })
        }
        let data = req.body
        if (!isvalidRequesbody(data)) {
            return res.status(400).send({ status: false, message: "please provide some data" })
        }


        // Using Destructring method
        let { items, totalPrice, totalItems, totalQuantity, cancellable, status, deletedAt, isDeleted } = data

        totalPrice = 0
        totalQuantity = 0
        let checkCart = await cartModel.findOne({ userId: userId })

        console.log(checkCart)
        if (!checkCart) {
            return res.status(400).send({ status: true, message: "Sorry!!! Cart with this id not present" })
        }

        if (!isValid(items)) {
            return res.stauts(400).send({ status: true, message: "your items array is empty, Nothing to order" })
        }

        for (let i = 0; i < items.length; i++) {
            if (!items[i].quantity && items[i].quantity == 0) {
                return res.status(400).send({ status: false, message: "please give quantity to products" })
            }

            if (!isValidObjectId(items[i].productId)) {
                return res.status(400).send({ status: true, message: "Sorry!!! the product id is not valid" })
            }
        }

        let productid
        let storeprodid = []
        for (let i = 0; i < items.length; i++) {
            productid = items[i].productId
            storeprodid.push(productid)
        }
        let product
        let storeprod = []
        for (let i = 0; i < storeprodid.length; i++) {
            product = await productModel.findById(storeprodid[i])

            storeprod.push(product)
        }
        let resProd = storeprod.flat()
        console.log(resProd)
        for (let i = 0; i < resProd.length; i++) {
            if (resProd.isDeleted == true) { 
                return res.status(400).send({ status: false, message: "some product you wanna order id deleted" }) }

            totalPrice = totalPrice + (storeprod[i].price) * (items[i].quantity)
            totalQuantity = totalQuantity + items[i].quantity
        }
        if (status) { if (!isvalidStatus(status)) { 
            return res.status(400).send({ status: false, message: "invalid status" })}}

        totalItems = items.length
        let crted = {
            userId,
            items,
            totalPrice,
            totalItems,
            totalQuantity,
            cancellable,
            status
        }

        let Order = await orderModel.create(crted)
        res.status(201).send({ status: true, message: "order placed", data: Order })
    }
    catch (err) { res.status(500).send({ status: false, error: err.message }) }
}

// ....................................Fifteen Api Update Order..................................

const updateOrder = async function (req, res) {
    let userId = req.params.userId
    let orderId = req.body.orderId
    let status = req.body.status

    if (!isvalidRequesbody(req.body)) { 
        return res.status(400).send({ status: false, message: "please give orderId and status in body" }) }

    if (!isValidObjectId(userId)) { 
        return res.status(400).send({ status: false, message: "Sorry !!! the given user id is not valid" }) }


    let checkuser = await userModel.findById(userId)

    if (!checkuser) { 
        return res.status(404).send({ status: false, message: "Sorry !!! No user found with the given id" }) }

    if (!isValidObjectId(orderId)) { 
        return res.status(400).send({ status: false, message: "Sorry !!! The given Order id is not valid" }) }


    let checkOrder = await orderModel.findById(orderId)

    if (!checkOrder) { 
        return res.status(404).send({ status: false, message:"Sorry!!! No order found with the given order id" })}

    if (!isvalidStatus(status)) { 
        return res.status(400).send({ status: false, message: "Sorry!!! The provided status is not valid" }) }

    if (checkOrderdata.cancellable == false) { 
        return res.status(400).send({ status: false, message: "Sorry!!! Can't update order, since it is not cancellable" })}

    let updateOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })
    res.status(200).send({ status: true, message: "order updated sucessfully", data: updateOrder })
}





module.exports.createOrder = createOrder
module.exports.updateOrder = updateOrder