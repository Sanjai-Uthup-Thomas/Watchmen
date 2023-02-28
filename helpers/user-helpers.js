var db = require('../config/connection')
const bcrypt = require('bcrypt')
const collections = require('../config/collections')
const ClientCapability = require('twilio/lib/jwt/ClientCapability')
// const { response } = require('../app')
const ObjectId = require('mongodb').ObjectId
require('dotenv').config()
const client = require('twilio')(collections.TWILIO_ACCOUNT_SID , collections.TWILIO_TOKEN )
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_YqkGZqC5fG5070',
    key_secret: '5g7d01FnpDJJ84Ta20EM85aZ',
});
var paypal = require('paypal-rest-sdk')
const { log } = require('console')
// const { log } = require('console') 
// const { truncate } = require('fs/promises')
// const { resolve } = require('path')
paypal.configure({ 
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AY_7IOxquRgS38IKa0C_Bjq4pQVp6kh-uEI4pRkrfLyp-nTby6AtL_HcS955qFbxzGsguHRE556HCyTW',
    'client_secret': 'EPZwmEQMz1GVTe53qi3HCb2pl8xCHNe9A0lEmASD9tn-bye9qKPZmt5hJ5yKcgOohlh4pTtYRdftWJvg'
});


module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let userSignup = await db.get().collection(collections.USER_COLLECTIONS).findOne({ $or: [{ PhoneNumber: userData.PhoneNumber }, { Email: userData.Email }] })
            if (userSignup) {
                existingStatus = true
                reject(existingStatus)

            } else {
                userData.Password = await bcrypt.hash(userData.Password, 10)
                userData.userStatus = true
                response = userData
                client.verify.services(collections.TWILIO_SERVICE_ID).verifications.create(
                    {
                        to: `+91${response.PhoneNumber}`,
                        channel: 'sms'
                    }
                ).then((data) => {

                })
                resolve(response)
            }
        })
    },
    editProfile: (uid, uData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let userSignup = await db.get().collection(collections.USER_COLLECTIONS).findOne({ $and: [{ PhoneNumber: uData.PhoneNumber }, { Email: uData.Email }] })
            if (userSignup) {
                existingStatus = true
                reject(existingStatus)

            } else {
                db.get().collection(collections.USER_COLLECTIONS).updateOne({ _id: ObjectId(uid) }, {
                    $set: {
                        FirstName: uData.FirstName,
                        LastName: uData.LastName,
                        Email: uData.Email,
                        PhoneNumber: uData.PhoneNumber


                    }
                }).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getUserProfile: (uid) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.USER_COLLECTIONS).findOne({ _id: ObjectId(uid) }).then((users) => {
                resolve(users)

            })
        })

    },
    signupOTP: (otp, userData) => {
        return new Promise((resolve, reject) => {
            let response = {}
            client.verify.services(collections.TWILIO_SERVICE_ID).verificationChecks.create({
                to: `+91${userData.PhoneNumber}`,
                code: otp.OTP
            }).then((verification_check) => {
                if (verification_check.status == 'approved') {
                    let referalCode = 7 * (userData.PhoneNumber)
                    let hexaCode = referalCode.toString(16);
                    userData.code = hexaCode
                    userData.wallet = 0
                    db.get().collection(collections.USER_COLLECTIONS).insertOne(userData).then(async (data) => {
                        let code = await db.get().collection(collections.USER_COLLECTIONS).findOne({ code: userData.referralCode })
                        if (code) {
                            db.get().collection(collections.USER_COLLECTIONS).updateOne({ _id: code._id }, {
                                $set: { wallet: code.wallet + 2000 }
                            })
                            db.get().collection(collections.USER_COLLECTIONS).updateOne({ Email: userData.Email }, {
                                $set: { wallet: 1000 }
                            })

                        }
                        resolve(userData)
                    })
                } else {
                    response.err = 'OTP is not valid'
                    resolve(response);
                }
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collections.USER_COLLECTIONS).findOne({ Email: userData.Email })
            if (user) {

                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        resolve({ status: false })
                    }
                })

            } else {
                resolve({ status: false })
            }
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTIONS).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collections.CART_COLLECTIONS).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collections.CART_COLLECTIONS).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: proObj }

                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            }
            else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collections.CART_COLLECTIONS).insertOne(cartObj).then((response) => {
                    resolve()
                })

            }


        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTIONS).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },

                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: 1,
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] } }
                    }
                }

            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = null
            let cart = await db.get().collection(collections.CART_COLLECTIONS).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    getCart: (userId, total) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTIONS).findOne({ user: ObjectId(userId) })

            if (cart) {
                let coupon = await db.get().collection(collections.COUPON_COLLECTIONS).findOne({ CouponName: cart.coupon })
                if (coupon) {

                    let offer = total * (coupon.DiscountPercentage / 100)
                    if (offer <= coupon.AmountUpto) {
                        var newTotal = total - offer
                    } else {
                        var newTotal = total - coupon.AmountUpto
                    }
                    response.total = newTotal
                    resolve(response)
                } else {
                    resolve()
                }

            } else {
                resolve()
            }


        })
    },
    changeProductQuantity: (details) => {


        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collections.CART_COLLECTIONS).updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then(() => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collections.CART_COLLECTIONS).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }
                ).then((response) => {

                    resolve({ status: true })
                })
            }
        })
    },
    deleteItem: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CART_COLLECTIONS).updateOne({ _id: ObjectId(data.cart) },
                {
                    $pull: { products: { item: ObjectId(data.product) } }
                }
            ).then((response) => {

                resolve(response)
            })
        })
    },
    getTotalAmount: (userId,productId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collections.CART_COLLECTIONS).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
              
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $match: {item: ObjectId(productId) }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },

                    }
                },
                {
                    $project: {

                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] } }
                    }
                }

            ]).toArray()
            console.log("total",total[0]);
            resolve(total[0])
        })

    },
    getGrandTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            grandTotal = await db.get().collection(collections.CART_COLLECTIONS).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: 1,
                        Price: {
                            $cond: {
                                if: "$product.offer", then: "$product.discountPrice", else: "$product.Price"
                            }
                        },
                        MRP: "$product.Price"
                    }
                },
                {
                    $group: {
                        _id: null,
                        grandTotal: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$Price' }] } },
                        discount: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.discount' }] } },
                        subtotal: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$MRP' }] } }
                    }
                }

            ]).toArray()
            resolve(grandTotal[0])
        })

    },

    placeOrder: (order, products, total, grandTotal, couponAmount, walletAmmount) => {
        return new Promise(async (resolve, reject) => {
            var currentTime = new Date();

            var currentOffset = currentTime.getTimezoneOffset();

            var ISTOffset = 660;   // IST offset UTC +5:30 

            var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
            let orderObj = {
                deliveryDetails: ObjectId(order.address),
                UserId: ObjectId(order.UserId),
                PaymentMethod: order['Payment-method'],
                products: products,
                TotalAmount: total,
                Status: 'pending',
                date: ISTTime,
                cancel: true,
                grandTotal: grandTotal.grandTotal,
                discount: grandTotal.discount,
                subtotal: grandTotal.subtotal,
                couponAmount: couponAmount,
                WalletAmmount: walletAmmount,
            }
            db.get().collection(collections.ORDER_COLLECTIONS).insertOne(orderObj).then((response) => {
                resolve(response.insertedId)
            })
        })

    },
    COD: (orderId, order) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        Status: 'placed',
                        cancel: true,
                        Return: false,
                    }
                }).then(() => {
                    db.get().collection(collections.CART_COLLECTIONS).deleteOne({ user: ObjectId(order.UserId) })
                    resolve()
                })
        })
    },
    genaratePaypal: (orderId, total) => {
        return new Promise((resolve, reject) => {
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "https://watchmen.life/success",
                    "cancel_url": "https://watchmen.life/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Red Sox Hat",
                            "sku": "001",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "Hat for the best team ever"
                }]
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    resolve(payment)
                }
            });

        })

    },
    getcartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTIONS).findOne({ user: ObjectId(userId) })
            resolve(cart.products)
        })
    },
    getUserOrderList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTIONS)
                .aggregate([

                    {
                        $match: {
                            $and: [{ UserId: ObjectId(userId) }, { $or: [{ Status: "placed" }, { Status: "Cancelled" }, { Status: 'Packed' }, { Status: 'Shipped' }, { Status: 'Delivered' }] }]
                        }

                    },
                    {
                        $project: {
                            TotalAmount: 1,
                            PaymentMethod: 1,
                            Status: 1,
                            date: {
                                $dateToString: {
                                    date: "$date",
                                    format:"%Y-%m-%d %H:%M:%S"
                                }
                            },
                            grandTotal: 1,
                            discount: 1,
                            subtotal: 1,
                            cancel: 1,
                            Return: 1,

                        }
                    },
                    {
                        $sort: { date: -1 }
                    }
                ]).toArray()
            resolve(orders)
        })
    },
    getUserOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $project: {
                        TotalAmount: 1,
                        PaymentMethod: 1,
                        Status: 1,
                        date: {
                            $dateToString: {
                                date: "$date",
                                format: "%d-%m-%Y",
                            }
                        },
                        grandTotal: 1,
                        discount: 1,
                        subtotal: 1,
                        couponAmount: 1,
                        WalletAmmount: 1
                    }
                }
            ]).toArray()
            resolve(order[0])
        })
    },
    cancelOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(orderId) }, {
                $set: {
                    Status: 'Cancelled',
                    Return: false,
                    cancel: false,



                }
            }).then((response)=>{
                resolve(response)
            }).catch((err)=>{
                reject(err)
            })
            
        })
    },
    returnOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(orderId) }, {
                $set: {
                    Status: 'Returned',
                    Return: false,
                    cancel: false,
                }
            }).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
          
        })
    },
    packOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(orderId) }, {
                $set: {
                    Status: 'Packed',
                    Return: false,
                    cancel: true,
                }
            })
            resolve()
        })
    },
    shipOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(orderId) }, {
                $set: {
                    Status: 'Shipped',
                    Return: false,
                    cancel: true,
                }
            })
            resolve()
        })
    },
    deliverOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(orderId) }, {
                $set: {
                    Status: 'Delivered',
                    Return: true,
                    cancel: false,
                }
            })
            resolve()
        })
    },
    viewAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $project: {
                        _id: 1,
                        UserId: 1,
                        PaymentMethod: 1,
                        TotalAmount: 1,
                        date: 1,
                        Status: 1,
                    }
                },
                {
                    $lookup: {
                        from: collections.USER_COLLECTIONS,
                        localField: 'UserId',
                        foreignField: '_id',
                        as: 'user',
                    }
                },

            ]).toArray()
            resolve(orders)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("new orders created", order);
                    resolve(order);
                }
            })

        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', '5g7d01FnpDJJ84Ta20EM85aZ');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])

            hmac = hmac.digest('hex');
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId, UserId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        Status: 'placed',
                        cancel: true,
                    }
                }).then(() => {
                    db.get().collection(collections.CART_COLLECTIONS).deleteOne({ user: ObjectId(UserId) })
                    resolve()
                })
        })
    },
    changePassword: (userId, details) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTIONS).findOne({ _id: ObjectId(userId) })
            if (user) {
                bcrypt.compare(details.Currentpassword, user.Password).then(async (status) => {
                    if (status) {
                        details.Newpassword = await bcrypt.hash(details.Newpassword, 10)

                        db.get().collection(collections.USER_COLLECTIONS).updateOne({ _id: ObjectId(userId) },
                            {
                                $set: {
                                    Password: details.Newpassword
                                }
                            }
                        )
                        resolve()
                    } else {
                        err = "Your current password is incorrect"
                        reject(err);
                    }
                })
            }
        })

    },
    getOrderProducts: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        orderId: ObjectId(orderId),
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        orderId: 1,
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $project: {
                        orderId: 1,
                        item: 1,
                        quantity: 1,
                        product: 1,
                        Price: {
                            $cond: {
                                if: "$product.offer", then: "$product.discountPrice", else: "$product.Price"
                            }
                        },
                        MRP: "$product.Price"
                    }
                }, {
                    $project: {
                        orderId: 1,
                        item: 1,
                        quantity: 1,
                        product: 1,
                        Price: 1,
                        MRP: 1,
                        grandTotal: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$Price' }] } },
                        discount: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.discount' }] } },
                        subtotal: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$MRP' }] } }

                    }
                }

            ]).toArray().then(async(orderItems)=>{

                let Product = await db.get().collection(collections.ORDERPRODUCT_COLLECTIONS).findOne({ orderItems: { $elemMatch: { _id: ObjectId(orderId) } } })
                if (Product) {
                    console.log("order console if");
                    resolve(orderItems)
                } else {
                    console.log("order console else");
                    db.get().collection(collections.ORDERPRODUCT_COLLECTIONS).insert({ orderItems }).then(() => {
                        resolve(orderItems)
                    })
                }
            }).catch((err)=>{
                reject(err)
            })

        })
    },
    getOrderProduct: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDERPRODUCT_COLLECTIONS).findOne({ orderItems: { $elemMatch: { _id: ObjectId(orderId) } } }).then((product)=>{
                resolve(product)
            }).catch((err)=>{
                reject(err)
            })
        })
    },

    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collections.COUPON_COLLECTIONS).find().toArray()
            resolve(coupon)
        })
    },
    useCouponDiscount: (data) => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collections.COUPON_COLLECTIONS).findOne({ CouponName: data.CouponName })
            if (coupon) {
                const date1 = new Date(coupon.EndingDate)
                const date2 = new Date()
                if (date2 <= date1) {

                    let UserAlreadyExists = coupon.users.includes(data.UserId)

                    if (UserAlreadyExists) {

                        resolve({ UserExists: true })
                    } else {

                        let user = data.UserId
                        db.get().collection(collections.COUPON_COLLECTIONS).updateOne({ CouponName: data.CouponName },
                            {
                                $push: {
                                    users: (user)
                                }
                            }).then((response) => {

                                let offer = parseInt(data.GrandTotal * (coupon.DiscountPercentage / 100))
                                if (offer <= coupon.AmountUpto) {
                                    var newTotal = data.GrandTotal - offer
                                    response.offer = parseInt(offer)
                                } else {
                                    var newTotal = data.GrandTotal - coupon.AmountUpto
                                    response.offer = parseInt(coupon.AmountUpto)
                                }

                                response.total = parseInt(newTotal)
                                resolve(response)
                            })
                    }
                } else {
                    resolve({ couponended: true })

                }
            }
            else {
                resolve({ noValidCoupon: true })

            }
        })
    },
    useWallet: async (data) => {
        return new Promise(async (resolve, reject) => {
            let wallet = data.wallet
            var newTotal = data.GrandTotal - data.wallet
            if (newTotal < 0) {
                newTotal = 0
            }
            if (data.GrandTotal < data.wallet) {
                data.wallet = data.wallet - data.GrandTotal
            }
            else {
                data.wallet = 0
            }
            db.get().collection(collections.USER_COLLECTIONS).updateOne({ _id: ObjectId(data.UserId) }, {
                $set: { wallet: data.wallet }
            }).then((response) => {
              
                response.total = newTotal
                response.wallet = wallet
                resolve(response)
            })


        })
    },
    getOrderAddress: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderAddress = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $lookup: {
                        from: collections.ADDRESS_COLLECTIONS,
                        localField: 'deliveryDetails',
                        foreignField: '_id',
                        as: 'Address'
                    }
                },
                {
                    $project: {
                        Address: {
                            $arrayElemAt: ['$Address', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(orderAddress[0])
        })
    }
}