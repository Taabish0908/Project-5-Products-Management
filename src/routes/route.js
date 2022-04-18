const express=require('express')
const userController = require('../controller/userControler')
const productController = require('../controller/productController')
const cartController = require('../controller/cartController')
const orderController = require('../controller/orderController')
const router = express.Router();
const authController = require('../middleware/auth')




// User Api with authentication & authorization in 2 api's
router.post("/register",userController.createUser);
router.post("/login",userController.userLogin);
router.get("/user/:userId/profile",authController.authenticate,authController.authorise, userController.getUser)
router.put("/user/:userId/profile",authController.authenticate,authController.authorise, userController.updateUser)

// Products Api No authentication and authorization required
router.post("/products",productController.createProduct)
router.get("/products",productController.getProduct)
router.get("/products/:productId",productController.getProductById)
router.put("/products/:productId",productController.updateProduct)
router.delete("/products/:productId",productController.deleteByid)

// Cart Api with authentication and authorization
router.post("/users/:userId/cart",authController.authenticate,authController.authorise,cartController.createCart)
router.put("/users/:userId/cart",authController.authenticate,authController.authorise,cartController.updateThecart)
router.get("/users/:userId/cart",authController.authenticate,authController.authorise,cartController.getCart)
router.delete("/users/:userId/cart",authController.authenticate,authController.authorise,cartController.deleteCart)

//Order Api with authentication and authorization
router.post("/users/:userId/orders",authController.authenticate,authController.authorise,orderController.createOrder)
router.put("/users/:userId/orders",authController.authenticate,authController.authorise,orderController.updateOrder)

module.exports=router
