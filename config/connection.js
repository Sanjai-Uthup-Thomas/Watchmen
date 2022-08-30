const mongoClient=require('mongodb').MongoClient
const State={
    db:null
}

module.exports.connect=function(done){
    const url='mongodb+srv://sanjaiuthup:classmate1998@watchmen.gxkekeg.mongodb.net/?retryWrites=true&w=majority'
    const dbname='Watchmen'

    mongoClient.connect(url,(err,data)=>{
        if(err)return done(err)
        State.db=data.db(dbname)
        done()
    })
}
module.exports.get=function(){
    return State.db
}