var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require("mongodb").ObjectId
module.exports = {
    addAddress: (udata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ADDRESS_COLLECTIONS).insertOne(udata).then(() => {
                resolve()
            })
        })
    },
    getUserAddress: (uId) => {
        return new Promise(async (resolve, reject) => {
            let Address = await db.get().collection(collections.ADDRESS_COLLECTIONS).find({ UserId: uId }).toArray()
            resolve(Address)
        })
    },
    getaddress: (aId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ADDRESS_COLLECTIONS).findOne({ _id: objectId(aId) }).then((address) => {
                resolve(address)
            })
        })
    },
    deleteAddress: (aId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ADDRESS_COLLECTIONS).deleteOne({ _id: objectId(aId) }).then((address) => {
                resolve(address)
            }).catch((err)=>{
                reject(err)
            })
        })
    },
    editAddress: (aId, Adata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ADDRESS_COLLECTIONS).updateOne({ _id: objectId(aId) }, {
                $set: {
                    FirstName: Adata.FirstName,
                    LastName: Adata.LastName,
                    Email: Adata.Email,
                    PhoneNumber: Adata.PhoneNumber,
                    HouseName: Adata.HouseName,
                    StreetName: Adata.StreetName,
                    City: Adata.City,
                    State: Adata.State,
                    Country: Adata.Country,
                    ZIPcode: Adata.ZIPCode,
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
}