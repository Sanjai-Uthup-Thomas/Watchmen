var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require("mongodb").ObjectId
module.exports = {
    addCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            let existingCategory = await db.get().collection(collections.CATEGORY_COLLECTIONS).findOne({ CategoryName: category.CategoryName })
            if (existingCategory) {
                existingStatus = true
                reject({ existingStatus })

            } else {
                db.get().collection(collections.CATEGORY_COLLECTIONS).insertOne(category).then(() => {
                    resolve()
})
            }
        })
    },
    getAllCategories: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collections.CATEGORY_COLLECTIONS).find().toArray()
            resolve(category)
        })
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collections.CATEGORY_COLLECTIONS).find().limit(6).toArray()
            resolve(category)
        })
    },
    deleteCategory: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTIONS).deleteOne({ _id: objectId(categoryId) }).then(() => {
                resolve()
            })
        })
    },
    getCategoryDetails: (cid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTIONS).findOne({ _id: objectId(cid) }).then((category) => {
                resolve(category)
            })
        })

    },
    updateCategoriesDetails: (cid, cdata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTIONS).updateOne({ _id: objectId(cid) }, {
                $set: {
                    CategoryName: cdata.CategoryName,
                    Status: cdata.Status
}
            }).then((response) => {
                resolve(response)
            })
        })
    },
    getCategoryWiseProducts: (cid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTIONS).aggregate([
                {
                    $match: { Category: objectId(cid) }
                },
                {
                    $lookup: {
                        from: collections.BRANDS_COLLECTIONS,
                        localField: 'Brand',
                        foreignField:"_id",
                        as:'brand'
                    }
                },
                {
                    $lookup:{
                        from: collections.CATEGORY_COLLECTIONS,
                        localField:'Category',
                        foreignField:'_id',
                        as:'category'

                    }
                },
                {
                    $project: {
                        WatchName:1,Price:1,image:1,Brand:'$brand.BrandName',Category:'$category.CategoryName',offer:1,discountPrice:1
                    }
                }
            ]).toArray().then((products)=>{
                resolve(products)
            }).catch((err)=>{
                reject(err)
            })

        })
    }

}
