var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require("mongodb").ObjectId
module.exports = {
    addProduct: async (product) => {
        let Category = await db.get().collection(collections.CATEGORY_COLLECTIONS).findOne({ CategoryName: product.Category })
        let Brand = await db.get().collection(collections.BRANDS_COLLECTIONS).findOne({ BrandName: product.Brand })
        product.Category = objectId(Category._id)
        product.Brand = objectId(Brand._id)
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTIONS).insertOne(product).then((data) => {
                resolve()
            })
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTIONS).aggregate([
                {
                    $lookup: {
                        from: collections.BRANDS_COLLECTIONS,
                        localField: 'Brand',
                        foreignField: '_id',
                        as: 'brand',
                    }
                },
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
                        Brand: "$brand.BrandName", Category: "$category.CategoryName", WatchName: 1, Price: 1, Description: 1, image: 1, offer: 1, discountPrice: 1
                    }
                }
            ]).toArray()
            resolve(products)
        })
    },
    getProductDetails: (pid) => {
        return new Promise((resolve, reject) => {
             db.get().collection(collections.PRODUCT_COLLECTIONS).aggregate([
                {
                    $match: {
                        _id: objectId(pid)
                    }
                },
                {
                    $lookup: {
                        from: collections.CATEGORY_COLLECTIONS,
                        localField: 'Category',
                        foreignField: '_id',
                        as: 'category',
                    }
                },
                {
                    $lookup: {
                        from: collections.BRANDS_COLLECTIONS,
                        localField: 'Brand',
                        foreignField: '_id',
                        as: 'brand',
                    }
                },
                {
                    $project: {
                        Brand: "$brand.BrandName", Category: "$category.CategoryName", WatchName: 1, Price: 1, Description: 1, image: 1, offer: 1, discountPrice: 1

                    }
                }
            ]).toArray().then((products) => {
                resolve(products[0])
            }).catch((err) => {
                reject(err)
            })



        })
    },
    updateProductDetails: async (pid, pdata) => {
        let Category = await db.get().collection(collections.CATEGORY_COLLECTIONS).findOne({ CategoryName: pdata.Category })
        let Brand = await db.get().collection(collections.BRANDS_COLLECTIONS).findOne({ BrandName: pdata.Brand })
        pdata.Category = objectId(Category._id)
        pdata.Brand = objectId(Brand._id)
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(pid) }, {
                $set: {
                    WatchName: pdata.WatchName,
                    Brand: pdata.Brand,
                    Price: pdata.Price,
                    Category: pdata.Category,
                    Description: pdata.Description,
                    Stock: pdata.Stock,

                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTIONS).deleteOne({ _id: objectId(productId) }).then((product) => {
                resolve(product)
            })
        })
    },
    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collections.PRODUCT_COLLECTIONS).find().toArray()
            resolve(product)
        })
    },

}  