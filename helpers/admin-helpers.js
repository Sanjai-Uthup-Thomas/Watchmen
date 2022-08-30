var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const collections = require('../config/collections')
const { Collection } = require('mongodb')
var objectId = require("mongodb").ObjectId
module.exports = {
    adminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collections.ADMIN_COLLECTIONS).findOne({ Email: adminData.Email })
            if (admin) {
                bcrypt.compare(adminData.Password, admin.Password).then((status) => {
                    if (status) {
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        }
        )
    },
    getAllusers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collections.USER_COLLECTIONS).find().toArray()
            resolve(users)
        })
    },
    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTIONS).updateOne({ _id: objectId(userId) }, {
                $set: {
                    userStatus: false
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTIONS).updateOne({ _id: objectId(userId) }, {
                $set: {
                    userStatus: true
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    codTotal: () => {
        return new Promise(async (resolve, reject) => {
            let cod = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: { PaymentMethod: 'COD' }
                },

                {
                    $count: "CODcount"
                }
            ]).toArray()
            resolve(cod)
        })
    },
    paypalTotal: () => {
        return new Promise(async (resolve, reject) => {
            let paypal = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: { PaymentMethod: 'paypal' }
                },

                {

                    $count: "paypalcount"

                }
            ]).toArray()
            resolve(paypal)
        })

    },
    razorpayTotal: () => {
        return new Promise(async (resolve, reject) => {
            let razorpay = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: { PaymentMethod: 'Razorpay' }
                },

                {
                    $count: "razorpaycount"
                }
            ]).toArray()
            resolve(razorpay)
        })
    },
    brands: () => {
        return new Promise(async (resolve, reject) => {
            let brands = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $unwind: '$products'
                }, {
                    $project: { item: '$products.item', quantity: '$products.quantity' }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: { quantity: 1, products: 1 }
                },
                {
                    $lookup: {
                        from: collection.BRANDS_COLLECTIONS,
                        localField: 'products.Brand',
                        foreignField: '_id',
                        as: 'brands',
                    }
                },
                {
                    $project: { quantity: 1, brands: 1 }
                },
                {
                    $unwind: '$brands'
                }, {
                    $group: { _id: { brands: '$brands.BrandName' }, quantity: { $sum: '$quantity' } }
                },
                {
                    $sort: { '_id.brands': 1 }
                }

            ]).toArray()
            resolve(brands)
        })
    },
    bestUser: () => {
        return new Promise(async (resolve, reject) => {
            let bestUser = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $group: {
                        _id: "$UserId", count: { $sum: 1 }
                    }
                }, {
                    $sort: { count: -1 }
                }, {
                    $lookup: {
                        from: collections.USER_COLLECTIONS,
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                }, {
                    $unwind: '$user'
                }
            ]).toArray()
            resolve(bestUser)
        })
    },
    mostReturnedProduct: () => {
        return new Promise(async (resolve, reject) => {
            let mostReturnedProduct = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: {
                        Status: 'Returned'
                    }
                },

                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $group: {
                        _id: "$products.item", count: { $sum: "$products.quantity" }
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $unwind: '$product'
                }
                , {
                    $sort: { count: -1 }
                }


            ]).toArray()
            resolve(mostReturnedProduct)
        })
    },
    mostCanceledProduct: () => {
        return new Promise(async (resolve, reject) => {
            let mostReturnedProduct = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: {
                        Status: 'Cancelled'
                    }
                },

                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $group: {
                        _id: "$products.item", count: { $sum: "$products.quantity" }
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $unwind: '$product'
                }
                , {
                    $sort: { count: -1 }
                }


            ]).toArray()
            resolve(mostReturnedProduct)
        })
    },
    mostDeliveredProduct: () => {
        return new Promise(async (resolve, reject) => {
            let mostReturnedProduct = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $match: {
                        Status: 'Delivered',
                    }
                },

                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $group: {
                        _id: "$products.item", count: { $sum: "$products.quantity" }
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTIONS,
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $unwind: '$product'
                }
                , {
                    $sort: { count: -1 }
                }


            ]).toArray()
            resolve(mostReturnedProduct)
        })
    },
    viewaddress: (orders) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $project: { _id: 0, deliveryDetails: 1 }
                },
                {
                    $lookup: {
                        from: collections.ADDRESS_COLLECTIONS,
                        localField: 'deliveryDetails',
                        foreignField: '_id',
                        as: 'address'
                    }
                }
            ]).toArray()
            resolve(address)
        })
    },
    addCoupons: (coupon) => {
        coupon.users = []
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.COUPON_COLLECTIONS).insertOne(coupon).then(() => {
                resolve(coupon)
            })
        })
    },
    countUsers: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collections.USER_COLLECTIONS).find().count()
            resolve(count)
        })
    },
    countOrders: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collections.ORDER_COLLECTIONS).find().count()
            resolve(count)
        })
    },
    totalSales: () => {
        return new Promise(async (resolve, reject) => {
            let totalSales = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([
                {
                    $group: {
                        _id: null,

                        TotalAmount: { $sum: { $toInt: "$TotalAmount" } }
                    }
                }

            ]).toArray()

            resolve(totalSales)
        })
    },
    dailySalesTotal: () => {
        return new Promise(async (resolve, reject) => {
            let dailySalesTotal = await db.get().collection(collections.ORDER_COLLECTIONS).aggregate([


                {
                    $group: {

                        _id: { day: { $dayOfMonth: "$date" }, month: { $month: "$date" }, year: { $year: "$date" } },
                        TotalAmount: { $sum: { $toInt: "$TotalAmount" } },
                        DiscountAmount: { $sum: { $toInt: "$discount" } },
                        SubTotal: { $sum: { $toInt: "$subtotal" } },
                        couponTotal: { $sum: { $toInt: "$couponAmount" } },
                        walletTotal: { $sum: { $toInt: "$WalletAmmount" } },
                        grandTotal: { $sum: { $toInt: "$grandTotal" } },

                    }
                },



            ]).toArray()
            resolve(dailySalesTotal)
        })
    },
    dateWiseSales: (date) => {
        console.log(date.fromDate);
        let date1 = new Date(date.fromDate)
        let date2 = new Date(date.toDate)
        var currentTime = new Date();
        var currentOffset = currentTime.getTimezoneOffset();
        var ISTOffset = 660;   // IST offset UTC +5:30 
        let start = new Date(date1.getTime() + (ISTOffset + currentOffset) * 60000);
        let end = new Date(date2.getTime() + (ISTOffset + currentOffset) * 60000);
        return new Promise(async (resolve, reject) => {
            dateWiseSale = await db.get().collection(collections.ORDER_COLLECTIONS)
                .aggregate([
                    {
                        $match: {
                            date: { $gte: start, $lte: end }

                        }
                    },
                    {
                        $group: {

                            _id: { day: { $dayOfMonth: "$date" }, month: { $month: "$date" }, year: { $year: "$date" } },
                            TotalAmount: { $sum: { $toInt: "$TotalAmount" } },
                            DiscountAmount: { $sum: { $toInt: "$discount" } },
                            SubTotal: { $sum: { $toInt: "$subtotal" } },
                            couponTotal: { $sum: { $toInt: "$couponAmount" } },
                            walletTotal: { $sum: { $toInt: "$WalletAmmount" } },
                            grandTotal: { $sum: { $toInt: "$grandTotal" } },
                        }
                    }
                ]).toArray()
            resolve(dateWiseSale)
        })
    },
    addoffers: async (data) => {
        let Category = await db.get().collection(collections.CATEGORY_COLLECTIONS).findOne({ CategoryName: data.Category })
        data.Category = objectId(Category._id)
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collections.OFFER_COLLECTIONS).findOne({ Category: data.Category })
            if (offer) {
                db.get().collection(collections.OFFER_COLLECTIONS).updateOne({ Category: data.Category }, {
                    $set: { offer: data.offer }
                })
                resolve()
            } else {
                db.get().collection(collections.OFFER_COLLECTIONS).insertOne(data)
                resolve()
            }

        })
    },
    addproductoffers: async (data) => {
        let Product = await db.get().collection(collections.PRODUCT_COLLECTIONS).findOne({ WatchName: data.WatchName })
        data.Product = objectId(Product._id)
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collections.PRODUCTOFFER_COLLECTIONS).findOne({ WatchName: data.WatchName })
            if (offer) {
                db.get().collection(collections.PRODUCTOFFER_COLLECTIONS).updateOne({ WatchName: offer.WatchName }, {
                    $set: { offer: data.offer }
                })
                resolve()
            } else {
                db.get().collection(collections.PRODUCTOFFER_COLLECTIONS).insertOne(data)
                resolve()
            }
        })
    },
    applyOffers: (data) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTIONS).find({ Category: data.Category }).toArray()


            if (products) {
                products.map((products) => {
                    products.Price = parseInt(products.Price)

                    data.offer = parseInt(data.OfferPercentage)
                    console.log(products.Price);
                    let newTotal = products.Price - products.Price * (data.offer / 100)
                    let discount = products.Price - newTotal
                    db.get().collection(collections.PRODUCT_COLLECTIONS).updateMany({ _id: objectId(products._id) }, {
                        $set: {
                            discountPrice: newTotal,
                            offer: true,
                            discount: discount,
                        }
                    })
                    resolve()
                })
            }
        })
    },
    applyProductOffers: (data) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collections.PRODUCT_COLLECTIONS).findOne({ WatchName: data.WatchName })
            if (product) {
                product.Price = parseInt(product.Price)
                data.offer = parseInt(data.OfferPercentage)
                let newTotal = product.Price - product.Price * (data.offer / 100)
                let discount = product.Price - newTotal
                db.get().collection(collections.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(product._id) }, {
                    $set: {
                        discountPrice: newTotal,
                        offer: true,
                        discount: discount,
                    }
                })
                resolve()
            }
        })
    }
    ,
    getAllOffers: () => {

        return new Promise(async (resolve, reject) => {
            let allOffers = await db.get().collection(collections.OFFER_COLLECTIONS).aggregate([
                {
                    $lookup: {
                        from: collections.CATEGORY_COLLECTIONS,
                        localField: 'Category',
                        foreignField: '_id',
                        as: 'category',
                    }
                },
                {
                    $project: {
                        Category: "$category.CategoryName", OfferPercentage: 1, _id: 1
                    }
                }
            ]).toArray()
            resolve(allOffers)
        })
    },
    getAllProductOffers: () => {
        return new Promise(async (resolve, reject) => {
            let productOffers = await db.get().collection(collections.PRODUCTOFFER_COLLECTIONS).find().toArray()
            resolve(productOffers)
        })
    },
    getCategoryId: (category) => {
        return new Promise(async (resolve, reject) => {
            let categoryID = await db.get().collection(collections.CATEGORY_COLLECTIONS).findOne({ CategoryName: category })
            resolve(categoryID._id)
        })

    },
    getProductId: (product) => {
        return new Promise(async (resolve, reject) => {
            let productID = await db.get().collection(collections.PRODUCT_COLLECTIONS).findOne({ WatchName: product })
            resolve(productID._id)
        })
    },
    deleteoffer: async (offerID, categoryId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.OFFER_COLLECTIONS).deleteOne({ _id: objectId(offerID) }).then(() => {
                db.get().collection(collections.PRODUCT_COLLECTIONS).updateMany({ Category: objectId(categoryId) },
                    {
                        $set: { offer: false, discount: 0 }
                    })
                resolve()
            })
        })
    },
    deleteProductOffer: async (productOffersID, productID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTOFFER_COLLECTIONS).deleteOne({ _id: objectId(productOffersID) }).then(() => {
                db.get().collection(collections.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(productID) }, {

                    $set: { offer: false, discount: 0 }
                })
                resolve()
            })
        })
    }

}