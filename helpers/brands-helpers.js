var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require("mongodb").ObjectId
module.exports = {

    addBrands: (Brands) => {

        return new Promise(async (resolve, reject) => {
            let existingBrand = await db.get().collection(collections.BRANDS_COLLECTIONS).findOne({ BrandName: Brands.BrandName })
            if (existingBrand) {
                console.log("Brand already exists");
                existingStatus = true
                reject({ existingStatus })

            } else {
                db.get().collection(collections.BRANDS_COLLECTIONS).insertOne(Brands).then(() => {
                    resolve()


                })
            }
        })
    },
    getAllBrands: () => {
        return new Promise(async (resolve, reject) => {
            let brands = await db.get().collection(collections.BRANDS_COLLECTIONS).find().sort({ "BrandName": 1 }).toArray()
            resolve(brands)
        })
    },
    deleteABrand: (BrandId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BRANDS_COLLECTIONS).deleteOne({ _id: objectId(BrandId) }).then(() => {
                resolve();
            })
        })
    },
    getBrandDetails: (bid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BRANDS_COLLECTIONS).findOne({ _id: objectId(bid) }).then((brands) => {
                resolve(brands)
            })
        })

    },
    updateBrandDetails: (bid, bdata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BRANDS_COLLECTIONS).updateOne({ _id: objectId(bid) }, {
                $set: {
                    BrandName: bdata.BrandName,


                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    getBrandWiseProducts: (bid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTIONS).aggregate([
                {
                    $match: { Brand: objectId(bid) }
                },
                {
                    $lookup: {
                        from: collections.BRANDS_COLLECTIONS,
                        localField: 'Brand',
                        foreignField: "_id",
                        as: 'brand'
                    }
                },
                {
                    $lookup: {
                        from: collections.CATEGORY_COLLECTIONS,
                        localField: 'Category',
                        foreignField: '_id',
                        as: 'category'

                    }
                },
                {
                    $project: {
                        WatchName: 1, Price: 1, image: 1, Brand: '$brand.BrandName', Category: '$category.CategoryName', offer: 1, discountPrice: 1
                    }
                }
            ]).toArray().then((products) => {
                resolve(products)
            }).catch((err) => {
                reject(err)
            })

        })
    }
}