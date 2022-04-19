const mongoose = require('mongoose')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const cartModel = require('../models/cartModel')


// .................Validation Functions..............................................

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

// ...............................Tenth Api Create the cart..............................................


const createCart = async function (req, res) {


    try {
        let data = req.body
        // if (!isValidRequestBody(data)) { 
        //     return res.status(400).send({ status: false, msg: "please give  data, must provide userid" }) }
        let { items } = data
        console.log(items)
        let userId = req.params.userId

        // if (!userId) { return res.status(400).send({ status: false, msg: "userId is required" }) }




        let checkUser = await userModel.findById(userId)

        if (!checkUser) {
            return res.status(404).send({ status: true, message: "Sorry!!! user with this id not found" })
        }

        let checkcartforuser = await cartModel.findOne({
            userId: userId
        })



        let product    /*to store product  which we get from prodid*/
        let productId
        let storeprod = []  /*to store product id*/
        let totalPrice = 0
        let totalItems
        let prod = []  /*to store all products of cart in one array*/
        let storeprOduct = [] /*to store all products of request body in one array*/

        // creation of empty cart if cart is not present or its items is equal to zero

        if (!checkcartforuser) {
            if (!items) {
                totalItems = 0
                totalPrice = 0
                items = []
                let dataa = {
                    userId,
                    items,
                    totalItems,
                    totalPrice
                }
                let cart = await cartModel.create(dataa)
                return res.status(201).send({ status: true, message: "cart is created but empty", data: cart })

            }
        }

                                        // ===========================================

        if (!items) {
            return res.status(400).send({ status: false, message: "please give some item" })
        }
        for (let i = 0; i < items.length; i++) {

            productId = req.body.items[i].productId
            if (!isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: "Sorry!!! invalid productid" })
            }

            storeprod.push(productId)
        }
        for (let i = 0; i < storeprod.length; i++) {

            if (!isValidObjectId(storeprod[i])) {
                return res.status(400).send({ status: false, message: "invalid product id" })
            }
            product = await productModel.find({ _id: storeprod[i] })


            storeprOduct.push(product)
        }
        let resl = storeprOduct.flat() /*Converting all the Sub-Array/concated into it from storeprOduct into 1 array*/

        for (i = 0; i < resl.length; i++) {
            if (resl[i].isDeleted == true) { return res.status(404).send({ status: false, message: "you are trying to add one or more than one deleted products in cart" }) }
        }
        // let resultantprod = prod.flat()

        //   if cart is available than addition of other items in same cart  
        if (checkcartforuser) {
            let _id = req.body._id
            if (!(_id)) {
                return res.status(400).send({ status: false, message: "please give cart id , since for given userid cart is present" })
            }
            if (!isValidObjectId(_id)) {
                return res.status(400).send({ status: false, message: "invalid cartid" })
            }
            let checkCartid = await cartModel.findById(_id)

            // checking if the user id in cart is same user id or not
            if (checkCartid.userId != userId) {
                return res.status(404).send({ status: false, message: "cartid is of diffrent user" })
            }

            // looping through the items array to check if the quantity of the product exist or not
            for (let i = 0; i < items.length; i++) {
                if (!items[i].quantity && items[i].quantity == 0) {
                    return res.status(400).send({ status: false, message: "please give quantity to products" })
                }
            }



            let addItems = await cartModel.findOneAndUpdate({ _id: _id }, { $push: { items: items } }, { new: true }).select({ totalPrice: 0, totalItems: 0 })

            // extracting all items keys from addItems in array
            let len = Object.keys(addItems.items)

            // calculating the total length of items
            totalItems = len.length


            // looping through the total-items to check for all items
            let orderedprod
            for (let i = 0; i < totalItems; i++) {
                orderedprod = await productModel.find({ _id: addItems.items[i].productId })

                // pushing the calculated orderedprod into the prod,to store all product in a cart in single array
                prod.push(orderedprod)
            }

            // converting all the sub-array from prod, since prod will have multiple items concated in sub-array
            let result = prod.flat()


            // calaculating the total price
            for (let i = 0; i < totalItems; i++) {

                totalPrice = totalPrice + (addItems.items[i].quantity) * (result[i].price)
            }


            let finalcart = await cartModel.findOneAndUpdate({ _id: _id }, { data: addItems, totalItems: totalItems, totalPrice: totalPrice }, { new: true })
            console.log(finalcart)


            return res.status(200).send({ status: true, msg: "items added to cart", data: finalcart })


        }
        // creation of cart and addition of items in same time


        totalItems = items.length

        for (let i = 0; i < totalItems; i++) {
            if (!items[i].quantity && items[i].quantity == 0) {
                return res.status(400).send({ status: false, message: "please give quantity to products" })
            }

            totalPrice = totalPrice + (data.items[i].quantity) * (resl[i].price) /* total price calculation*/
        }
        let reslt = {

            userId,
            items,

            totalItems,
            totalPrice
        }



        let createCart = await cartModel.create(reslt)
        res.status(201).send({ status: true, message: "cart created", data: createCart })
    }
    catch (err) { res.status(500).send({ status: false, error: err.message }) }
}


// .........................Eleventh Api Update the cart.........................................................


const updateThecart = async function (req, res) {
    try {
        const userId = req.params.userId
        const data = req.body
        const { cartId, productId, removeProduct } = data

        const user = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!user) {
            return res.status(404).send({ status: false, message: 'No user found with the given user id' })
        }

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: 'please provide something in the request body' })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, mesage: "given user id is not valid" })
        }
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: 'the given cart id is not valid' })
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "the given product id is not valid" })
        }
        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, message: 'please provide the cart id in the request body' })
        }
        if (!isValid(productId)) {
            return res.status(400).send({ status: false, message: 'please provide the product id in the request body' })
        }
        if (!(((removeProduct === 1) || (removeProduct === 0)))) {
            return res.status(400).send({ status: false, message: 'remove product shoud be 1 or 0' })
        }

        const findCart = await cartModel.findOne({ _id: cartId, isDeleted: false })
        if (!findCart) {
            return res.status(404).send({ status: false, message: 'no cart found with the given cart id' })
        }
        const product = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!product) {
            return res.status(404).send({ status: false, message: 'product does not exit' })
        }

        let item = findCart.items
        for (let i = 0; i < item.length; i++) {
            if (item[i].productId == productId) {
                let productPrice = item[i].quantity * product.price
                if (removeProduct === 0) {
                    const productItem = await cartModel.findByIdAndUpdate({ _id: cartId }, {
                        $pull: { items: { productId: productId } },
                        totalPrice: findCart.totalPrice - productPrice, totalItems: findCart.totalItems - 1
                    }, { new: true })
                    return res.status(200).send({ status: true, message: 'product removed suceesfully', Data: productItem })
                }

                if (removeProduct === 1) {
                    if (item[i].quantity === 1 && removeProduct === 1) {
                        const removeCart = await cartModel.findByIdAndUpdate({ _id: cartId }, {
                            $pull: { items: { productId: productId } },
                            totalPrice: findCart.totalPrice - productPrice, totalItems: findCart.totalItems - 1
                        }, { new: true })
                        return res.status(200).send({ status: true, message: 'product removed', Data: removeCart })
                    }

                    item[i].quantity = item[i].quantity - 1
                    const updateCart = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: item, totalPrice: findCart.totalPrice - product.price - 1 },
                        { new: true })
                    return res.status(200).send({ status: true, message: 'product item decreased successfully', Data: updateCart })
                }


            }
        }


    } catch (error) {
        { res.status(500).send({ status: false, error: err.message }) }

    }
}


// ..........................Twelveth Api Get cart..................................................................

const getCart = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Sorry!!! USer id is not valid " })
        }
        const user = await userModel.findById({ _id: userId })
        if (!user) {
            return res.status(400).send({ status: false, message: "please provide the user id" })
        }

        const cart = await cartModel.findOne({ userId: userId })
        if (!cart) {
            return res.status(400).send({ status: false, message: "Sorry!!! No cart exist with this user id" })
        }
        return res.status(200).send({ status: true, message: "successfull", data: cart })

    } catch (error) {
        return res.status(500).send({ status: false, error: err.message })

    }
}


// .................................Thirteen Api Delete Cart...............................................................

let deleteCart = async function (req, res) {
    userId = req.params.userId

    if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: true, message: "Sorry!!! The user id is not valid" })
    }

    let checkuserexist = await userModel.findById(userId)
    if (!checkuserexist) {
        return res.status(404).send({ status: true, message: "Sorry!!! No user found with this user id" })
    }

    let checkCartexist = await cartModel.findOne({ userId: userId })
    if (!checkCartexist) {
        return res.status(400).send({ status: false, message: "Sorry!!! No cart exist for this user id" })
    }

    let items = checkCartexist.items
    items = []
    let totalPrice = checkCartexist.totalPrice
    totalPrice = 0
    let totalItems = checkCartexist.totalPrice
    totalItems = 0
    let deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, { items, totalPrice, totalItems }, { new: true })


    return res.status(200).send({ status: true, msg: "Cart item deleted sucessfully", data: deleteCart })
}

module.exports.createCart = createCart
module.exports.updateThecart = updateThecart
module.exports.getCart = getCart
module.exports.deleteCart = deleteCart