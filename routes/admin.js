var express = require('express');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers')
const brandsHelpers = require('../helpers/brands-helpers')
var router = express.Router();
let multer = require('multer');
const userHelpers = require('../helpers/user-helpers');
const { LogContext } = require('twilio/lib/rest/serverless/v1/service/environment/log');

const verifyAdminLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin')
  }
}
/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.session.admin) {
    res.redirect('/admin/admindashboard')
  } else {
    res.render('admin/adminLogin', { user: false, admin: true, adminhead: false, "adminloginErr": req.session.adminloginErr });
    req.session.adminloginErr = false
  }
});
router.post('/adminlogin', (req, res) => {
  adminHelpers.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = true
      res.redirect('/admin/admindashboard')

    } else {
      req.session.adminloginErr = "Invalid Email or Password"
      res.redirect('/admin')
    }

  })
})
router.get('/logout', (req, res) => {
  req.session.admin = null
  res.redirect('/admin')
})
router.get('/admindashboard',verifyAdminLogin, (req, res) => {
  userHelpers.viewAllOrders().then(async (orders) => {
    let cod = await adminHelpers.codTotal()
    let paypal = await adminHelpers.paypalTotal()
    let razorpay = await adminHelpers.razorpayTotal()
    let countUsers = await adminHelpers.countUsers()
    let countOrders = await adminHelpers.countOrders()
    let totalSales = await adminHelpers.totalSales()
    let brands = await adminHelpers.brands()
    let bestUser = await adminHelpers.bestUser()
    let mostReturnedProduct = await adminHelpers.mostReturnedProduct()
    let mostDeliveredProduct = await adminHelpers.mostDeliveredProduct()
    let mostCanceledProduct = await adminHelpers.mostCanceledProduct()



    res.render("admin/adminDash", { user: false, admin: true, adminhead: true, orders, cod, paypal, razorpay, countUsers, countOrders, totalSales, brands, bestUser, mostReturnedProduct, mostCanceledProduct, mostDeliveredProduct })
  })
})
router.get('/SalesReport',verifyAdminLogin, async (req, res) => {
  let dailySales = await adminHelpers.dailySalesTotal()
  res.render('admin/SalesReport', { user: false, admin: true, adminhead: true, dailySales })

})
router.post("/dateSales", async (req, res) => {
  req.session.body = req.body
  let dateSales = await adminHelpers.dateWiseSales(req.body)
  req.session.dateSale = dateSales
  res.redirect('/admin/dateSales')
})
router.get("/dateSales",verifyAdminLogin, (req, res) => {
  userHelpers.viewAllOrders().then(async (orders) => {
    date = req.session.body
    dateSales = req.session.dateSale
    res.render("admin/adminDash2", { user: false, admin: true, adminhead: true, dateSales, date })
  })
})
router.get('/allusers', verifyAdminLogin, (req, res) => {
  adminHelpers.getAllusers().then((users) => {
    res.render('admin/allUsers', { users, user: false, admin: true, adminhead: true })
  })
})
router.get('/blockUser/:id', verifyAdminLogin, (req, res) => {
  let userId = req.params.id
  adminHelpers.blockUser(userId).then((response) => {
    res.redirect('/admin/allusers')
  })
})
router.get('/unblockUser/:id', verifyAdminLogin, (req, res) => {
  let userId = req.params.id
  adminHelpers.unblockUser(userId).then((response) => {
    res.redirect('/admin/allusers')
  })
})
router.get('/allproducts', verifyAdminLogin, (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/allProducts", { user: false, admin: true, products, adminhead: true })
  })
})
router.get('/addproducts', verifyAdminLogin, (req, res) => {
  brandsHelpers.getAllBrands().then((brands) => {
    categoryHelpers.getAllCategories().then((category) => {
      res.render('admin/addProducts', { user: false, admin: true, adminhead: true, category, brands })
    })
  })
})
const fileStorageEngineproduct = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images/products')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '--' + file.originalname)
  }
})
const upload = multer({ storage: fileStorageEngineproduct })

router.post('/addproducts', upload.array('Image', 3), function (req, res) {
  var filenames = req.files.map(function (file) {
    return file.filename
  })
  req.body.image = filenames
  productHelpers.addProduct(req.body).then(() => {

    res.redirect('/admin/allproducts')
  })

})
router.get('/updateproducts/:id', verifyAdminLogin,(req, res) => {
  productHelpers.getProductDetails(req.params.id).then((products)=>{
    brandsHelpers.getAllBrands().then((brands) => {
      categoryHelpers.getAllCategories().then((category) => {
  
        res.render('admin/updateProducts', { user: false, admin: true, products, adminhead: true, category, brands })
      })
    })
  }).catch((err) => {
    res.render('error')
  })




})
router.post('/updateproducts/:id', upload.array('Image', 3), (req, res) => {
  var filenames = req.files.map(function (file) {
    return file.filename
  })
  req.body.image = filenames
  productHelpers.updateProductDetails(req.params.id, req.body).then(() => {
    res.redirect('/admin/allproducts')
  })
})
router.get('/deleteproducts/:id', verifyAdminLogin, (req, res) => {
  let productId = req.params.id
  productHelpers.deleteProduct(productId).then((response) => {
    res.redirect('/admin/allproducts')
  })
})
router.get('/allcategories', verifyAdminLogin, (req, res) => {
  categoryHelpers.getAllCategories().then((category) => {
    res.render("admin/allCategories", { user: false, admin: true, category, adminhead: true })
  })
})
router.get('/addcategories', verifyAdminLogin, (req, res) => {
  res.render('admin/addcategories', { admin: true, adminhead: true, "categoryerr": req.session.categoryErr })
  req.session.categoryErr = null
})
const fileStorageEnginecategory = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images/categories')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '--' + file.originalname)
  }
})
const uploadcategory = multer({ storage: fileStorageEnginecategory })

router.post('/addcategories', uploadcategory.array('Images', 1), (req, res) => {
  var filenames = req.files.map(function (file) {
    return file.filename
  })
  req.body.image = filenames
  categoryHelpers.addCategory(req.body).then(() => {
    res.redirect('/admin/allcategories')
  }).catch((existingUser) => {
    if (existingUser) {
      req.session.categoryErr = "Category already in use"
      res.redirect('/admin/addcategories')
    }
  })
})
router.get('/updatecategories/:id', verifyAdminLogin, async (req, res) => {
  let categories = await categoryHelpers.getCategoryDetails(req.params.id)
  res.render('admin/updateCategories', { user: false, admin: true, categories, adminhead: true })
})
router.post('/updatecategories/:id', uploadcategory.array('Images', 1), (req, res) => {
  var filenames = req.files.map(function (file) {
    return file.filename
  })
  req.body.image = filenames
  categoryHelpers.updateCategoriesDetails(req.params.id, req.body).then(() => {
    res.redirect('/admin/allcategories')
  })
})
router.get('/deletecategories/:id', verifyAdminLogin, (req, res) => {
  let categoryId = req.params.id
  categoryHelpers.deleteCategory(categoryId).then((response) => {
    res.redirect('/admin/allcategories')
  })
})
router.get('/addbrands', verifyAdminLogin, (req, res) => {
  res.render('admin/addBrands', { admin: true, adminhead: true, "brandserr": req.session.brandsErr })
  req.session.brandsErr = false
})
router.post('/addbrands', (req, res) => {
  brandsHelpers.addBrands(req.body).then(() => {
    res.redirect('/admin/allbrands')
  }).catch((existingUser) => {
    if (existingUser) {
      req.session.brandsErr = "Brand already in use"
      res.redirect('/admin/addbrands')
    }
  })
})
router.get('/allbrands', verifyAdminLogin, (req, res) => {
  brandsHelpers.getAllBrands().then((brands) => {
    res.render('admin/allbrands', { admin: true, adminhead: true, brands })
  })
})
router.get('/deletebrands/:id', verifyAdminLogin, (req, res) => {
  brandsHelpers.deleteABrand(req.params.id).then(() => {
    res.redirect('/admin/allbrands')
  })
})
router.get('/updatebrands/:id', verifyAdminLogin, async (req, res) => {
  let brands = await brandsHelpers.getBrandDetails(req.params.id)
  res.render('admin/updateBrands', { user: false, admin: true, brands, adminhead: true })

})
router.post('/updatebrands/:id', async (req, res) => {
  brandsHelpers.updateBrandDetails(req.params.id, req.body).then(() => {
    res.redirect('/admin/allbrands')
  })
})
router.get('/allorders', verifyAdminLogin, (req, res) => {
  userHelpers.viewAllOrders().then((orders) => {
    adminHelpers.viewaddress(orders).then((address) => {
      res.render('admin/allorders', { admin: true, adminhead: true, orders, address })
    })
  })
})
router.get('/vieworder/:id', verifyAdminLogin, async (req, res) => {
  let products = await userHelpers.getOrderProduct(req.params.id)
  console.log("products", products);
  let address = await userHelpers.getOrderAddress(req.params.id)
  let order = await userHelpers.getUserOrder(req.params.id)
  res.render('admin/vieworders', { admin: true, adminhead: true, products, address, order })
})
router.get('/ordercancel/:id', verifyAdminLogin, (req, res) => {
  userHelpers.cancelOrder(req.params.id).then((response) => {
    res.redirect('/admin/allorders')
  })
})
router.get('/orderpacked/:id', verifyAdminLogin, (req, res) => {
  userHelpers.packOrder(req.params.id).then((response) => {
    res.redirect('/admin/allorders')
  })
})
router.get('/ordershipped/:id', verifyAdminLogin, (req, res) => {
  userHelpers.shipOrder(req.params.id).then((response) => {
    res.redirect('/admin/allorders')
  })
})
router.get('/orderdelivered/:id', verifyAdminLogin, (req, res) => {
  userHelpers.deliverOrder(req.params.id).then((response) => {
    res.redirect('/admin/allorders')
  })
})
router.get('/AddCoupons', verifyAdminLogin, (req, res) => {
  res.render('admin/addcoupons', { admin: true, adminhead: true })
})
router.post('/addcoupon', (req, res) => {
  adminHelpers.addCoupons(req.body).then((response) => {
    res.redirect('/admin/AddCoupons')
  })
})
router.get('/allcoupons', verifyAdminLogin, async (req, res) => {
  let Coupon = await userHelpers.getAllCoupons()
  res.render('admin/allcoupons', { admin: true, adminhead: true, Coupon })
})
router.get('/alloffers', verifyAdminLogin, async (req, res) => {
  let allOffers = await adminHelpers.getAllOffers()
  res.render('admin/alloffers', { admin: true, adminhead: true, allOffers })
})
router.get('/addoffers', verifyAdminLogin, async (req, res) => {
  let category = await categoryHelpers.getAllCategories()
  let products = await productHelpers.getAllProduct()

  res.render('admin/addoffers', { admin: true, adminhead: true, category, products })
})
router.post('/addoffers', async (req, res) => {
  adminHelpers.addoffers(req.body).then(() => {
    adminHelpers.applyOffers(req.body).then(() => {
      res.redirect('/admin/alloffers')
    })
  })
})
router.post('/addproductoffers', async (req, res) => {
  adminHelpers.addproductoffers(req.body).then(() => {
    adminHelpers.applyProductOffers(req.body).then(() => {
      res.redirect('/admin/allproductoffers')
    })
  })
})
router.get('/allproductoffers', verifyAdminLogin, async (req, res) => {
  let allProductOffers = await adminHelpers.getAllProductOffers()
  res.render('admin/allproductoffers', { admin: true, adminhead: true, allProductOffers })
})
router.get('/deleteoffer/:id/:category', verifyAdminLogin, (req, res) => {
  adminHelpers.getCategoryId(req.params.category).then((categoryId) => {
    adminHelpers.deleteoffer(req.params.id, categoryId).then(() => {
      res.redirect('/admin/alloffers')
    })
  })
})
router.get('/deleteproductsoffer/:id/:product', verifyAdminLogin, (req, res) => {
  adminHelpers.getProductId(req.params.product).then((productId) => {
    adminHelpers.deleteProductOffer(req.params.id, productId).then(() => {
      res.redirect('/admin/allproductoffers');
    })

  })
})
module.exports = router;
