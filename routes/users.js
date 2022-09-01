var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers');
const addressHelpers = require('../helpers/address-helpers');
const brandsHelpers = require('../helpers/brands-helpers');
const session = require('express-session');
var paypal = require('paypal-rest-sdk')
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AY_7IOxquRgS38IKa0C_Bjq4pQVp6kh-uEI4pRkrfLyp-nTby6AtL_HcS955qFbxzGsguHRE556HCyTW',
  'client_secret': 'EPZwmEQMz1GVTe53qi3HCb2pl8xCHNe9A0lEmASD9tn-bye9qKPZmt5hJ5yKcgOohlh4pTtYRdftWJvg'
});


const verifyUserLogin = async (req, res, next) => {
  if (req.session.user) {
    loggedUser = req.session.userDetails
    cartCount = await userHelpers.getCartCount(loggedUser._id)
    next()
  } else {
    res.redirect('/')
  }
}
const verifyUserLogin2 = (req, res, next) => {
  if (req.session.user) {
    loggedUser = req.session.userDetails
    res.redirect('/')
  } else {
    next()
  }
}
let cartCount = null


const verifyUserLogin3 = async (req, res, next) => {
  let loggedUser = req.session.userDetails
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(loggedUser._id)
  }
  next()
}


router.get('/', verifyUserLogin3, (req, res, next) => {
  let loggedUser = req.session.userDetails
  productHelpers.getAllProducts().then(async (products) => {
    let category = await categoryHelpers.getAllCategories()
    let categories = await categoryHelpers.getAllCategory()

    let brands = await brandsHelpers.getAllBrands()
    res.render('user/userLanding', { users: true, userhead: true, userfoot: true, loggedUser, cartCount, category, products, brands,categories});
  })
});
router.get('/userlogin', verifyUserLogin2, async (req, res) => {

  let category = await categoryHelpers.getAllCategories()
  let brands = await brandsHelpers.getAllBrands()
  res.render('user/userLogin', { users: true, userhead: true, userfoot: true, "userloginErr": req.session.loginErr, "blockErr": req.session.blockErr, category, brands });
  req.session.loginErr = false
  req.session.blockErr = false


})
router.post('/userlogin', (req, res) => {
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response) => {


    if (response.status) {
      if (response.user.userStatus) {
        req.session.user = true
        req.session.userDetails = response.user

        res.redirect('/')

      } else {
        req.session.blockErr = "Your account is blocked by the admin"
        res.redirect('/userlogin')

      }
    } else {
      req.session.loginErr = "Invalid Email Address or Password"
      res.redirect('/userlogin')
    }
  })
})
router.get('/usersignup', verifyUserLogin2, async (req, res) => {
  let category = await categoryHelpers.getAllCategories()
  let brands = await brandsHelpers.getAllBrands()

  res.render('user/userSignup', { users: true, userhead: true, userfoot: true, "phoneErr": req.session.phoneErr, category, brands })
  req.session.phoneErr = false

})
let userdata
router.post('/usersignup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    userdata = response
    res.redirect('/userotp')


  }).catch((existingUser) => {
    if (existingUser) {
      req.session.phoneErr = "Phone number or Email address already in use"
      res.redirect('/usersignup')

    }
  })
})
router.get('/userotp', verifyUserLogin2, async (req, res) => {
  let category = await categoryHelpers.getAllCategories()
  let brands = await brandsHelpers.getAllBrands()

  res.render('user/userOTP', { users: true, userhead: true, userfoot: true, category, brands })

})
router.post('/userotp', (req, res) => {
  userHelpers.signupOTP(req.body, userdata).then((response) => {
    res.redirect('/userlogin')

  })
})
router.get('/userlogout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
router.get('/viewproducts', verifyUserLogin3, async (req, res) => {
  let loggedUser = req.session.userDetails
  productHelpers.getAllProducts().then((products) => {
    categoryHelpers.getAllCategories().then((category) => {
      brandsHelpers.getAllBrands().then((brands) => {
        res.render('user/viewProducts', { users: true, userhead: true, userfoot: true, products, loggedUser, cartCount, category, brands })
      })
    })
  })
})
router.get('/productdetails/:id', verifyUserLogin3, async (req, res) => {
  let loggedUser = req.session.userDetails
  productHelpers.getProductDetails(req.params.id).then((product) => {
    categoryHelpers.getAllCategories().then((category) => {
      brandsHelpers.getAllBrands().then((brands) => {
        res.render('user/productsDetails', { product, users: true, userfoot: true, userhead: true, loggedUser, cartCount, brands, category })
      })
    })
  }).catch((error) => {
    res.render('error')
  })
})
router.get('/usercart', async (req, res) => {
  if (req.session.user) {
    let loggedUser = req.session.userDetails
    let cartCount = null
    cartCount = await userHelpers.getCartCount(loggedUser._id)
    categoryHelpers.getAllCategories().then((category) => {
      brandsHelpers.getAllBrands().then(async (brands) => {
        if (cartCount >= 1) {
          let products = await userHelpers.getCartProducts(req.session.userDetails._id)
          let total = await userHelpers.getTotalAmount(req.session.userDetails._id)
          let grandTotal = await userHelpers.getGrandTotalAmount(req.session.userDetails._id)
          console.log("products", products);
          res.render('user/cart', { users: true, userfoot: true, userhead: true, products, loggedUser, cartCount, total, grandTotal, brands, category })
        }
        else {
          res.render('user/cart', { users: true, userfoot: true, userhead: true, loggedUser, cartCount, brands, category })
        }
      })
    })
  } else {
    res.redirect('/')
  }

})
router.get('/addtocart/:id', (req, res) => {

  if (req.session.user) {
    userHelpers.addToCart(req.params.id, req.session.userDetails._id).then(() => {
      res.json({ status: true })
    })
  } else {
    res.redirect('/userlogin')
  }
})
router.post('/change-product-quantity', async (req, res, next) => {
  console.log(req.body);
  await userHelpers.changeProductQuantity(req.body).then(async (response) => {
    console.log("response: " + response);
    response.total = await userHelpers.getTotalAmount(req.body.user, req.body.product)
    response.grandTotal = await userHelpers.getGrandTotalAmount(req.body.user)
    console.log("response: " + response);
    res.json(response)
  })
})
router.post('/deleteProduct', (req, res, next) => {
  userHelpers.deleteItem(req.body).then((response) => {
    res.json(response)
  })
})
router.get('/checkout', verifyUserLogin, async (req, res, next) => {
  let cartCount = null
  if (req.session.user) {
    let loggedUser = req.session.userDetails
    console.log(loggedUser)
    console.log(loggedUser._id);
    console.log(req.session.userDetails._id);
    cartCount = await userHelpers.getCartCount(loggedUser._id)
    let total = await userHelpers.getTotalAmount(req.session.userDetails._id)
    let products = await userHelpers.getCartProducts(req.session.userDetails._id)
    let grandTotal = await userHelpers.getGrandTotalAmount(req.session.userDetails._id)
    let address = await addressHelpers.getUserAddress(req.session.userDetails._id)
    let Coupon = await userHelpers.getAllCoupons()
    categoryHelpers.getAllCategories().then((category) => {
      brandsHelpers.getAllBrands().then(async (brands) => {
        res.render('user/checkout', { users: true, userfoot: true, userhead: true, products, loggedUser, cartCount, total, grandTotal, address, Coupon, brands, category })
      })
    })
  } else {
    res.redirect('/')
  }
})
router.post('/couponDiscount', (req, res) => {
  console.log("req.body");
  console.log(req.body);
  userHelpers.useCouponDiscount(req.body).then((response) => {
    res.json(response)

  })



})
router.post('/wallet', (req, res) => {
  console.log(req.body);
  userHelpers.useWallet(req.body).then((response) => {
    console.log(response.total);
    console.log(response.wallet);

    res.json(response)

  })
})
router.post('/place-order', async (req, res) => {
  console.log(req.body);
  let couponAmount = 0
  walletAmmount = req.body.walletAmmount
  couponAmount = req.body.couponAmmount
  let products = await userHelpers.getcartProductList(req.body.UserId)
  let grandTotal = await userHelpers.getGrandTotalAmount(req.body.UserId)
  req.session.total = req.body.grandTotal

  userHelpers.placeOrder(req.body, products, req.session.total, grandTotal, couponAmount, walletAmmount).then((orderId) => {
    req.session.orderId = orderId
    if (req.body['Payment-method'] === 'COD') {
      userHelpers.COD(orderId, req.body).then(() => {

        res.json({ codSuccess: true })
      })

    } else if (req.body['Payment-method'] === 'paypal') {
      userHelpers.genaratePaypal(orderId, req.session.total).then((response) => {
        response.paypalSuccess = true
        // paypalSuccess=true
        console.log("paypal response: " + response);
        res.json(response)
      })
    } else {

      userHelpers.generateRazorpay(orderId, req.session.total).then((response) => {
        res.json(response)

      })
    }
  })

})
router.get('/success', (req, res) => {
  let amount = req.session.total
  let userId = req.session.userDetails._id
  let orderIdPaypal = req.session.orderId
  console.log("paypal orderid: " + orderIdPaypal);
  userHelpers.changePaymentStatus(orderIdPaypal, userId).then(() => {
    const payerId = req.query.PayerID
    console.log(payerId);
    const paymentId = req.query.paymentId

    console.log("amount: " + amount);

    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
        "amount": {
          "currency": "USD",
          "total": "" + amount
        },
      }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
        console.log(error);
        console.log('err');
        throw error
      } else {
        console.log('success');
        console.log(payment);
        res.redirect('/orderplaced')
      }
    })

  })
})
router.post('/verify-payment', (req, res) => {

  userId = req.session.userDetails._id
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]'], userId).then(() => {
      res.json({ status: true })
    })

  }).catch((err) => {
    res.json({ status: false, errMsg: "" })
  })
})
router.get('/orderplaced', verifyUserLogin, (req, res) => {
  let orderId=req.session.orderId
  userHelpers.getOrderProducts(orderId).then(() => {
  res.render('user/orderPlaced', { users: true, userfoot: true, userhead: true })
  })
})
router.get('/userOrders', verifyUserLogin, async (req, res) => {
  if (req.session.user) {
    let loggedUser = req.session.userDetails

    let orders = await userHelpers.getUserOrderList(loggedUser._id)
    console.log(orders);
    res.render('user/userOrders', { users: true, userfoot: true, userhead: true, orders, loggedUser, cartCount })
  } else {
    res.redirect('/')
  }
})
router.get('/orderinvoice/:id', verifyUserLogin, (req, res) => {
  let loggedUser = req.session.userDetails
  userHelpers.getOrderProduct(req.params.id).then(async (products) => {
    let address = await userHelpers.getOrderAddress(req.params.id)
    let order = await userHelpers.getUserOrder(req.params.id)
    res.render('user/invoice', { users: true, userfoot: true, userhead: true, products, address, order, loggedUser, cartCount })
  }).catch((err) => {
    res.render('error')
  })
})
router.get('/cancelOrder/:id', (req, res) => {
  let orderId = req.params.id
  userHelpers.cancelOrder(orderId).then((response) => {
    res.redirect('/userOrders/')
  }).catch((err) => {
    res.render('error')
  })
})
router.get('/returnOrder/:id', (req, res) => {
  let orderId = req.params.id
  userHelpers.returnOrder(orderId).then((response) => {
    res.redirect('/userOrders/')
  }).catch((err) => {
    res.render('error')
  })
})
router.get('/userProfile', verifyUserLogin, async (req, res) => {
  let loggedUser = req.session.userDetails
  let user = await userHelpers.getUserProfile(loggedUser._id)
  res.render('user/userProfile', { users: true, userfoot: true, userhead: true, loggedUser, user, cartCount })
})
router.get('/editProfile', verifyUserLogin, (req, res) => {
  let loggedUser = req.session.userDetails
  res.render('user/editProfile', { users: true, userfoot: true, userhead: true, loggedUser, "editErr": req.session.editErr, cartCount })
  req.session.editErr = false
})
router.post('/editProfile', (req, res) => {
  let loggedUser = req.session.userDetails
  userHelpers.editProfile(loggedUser._id, req.body).then((response) => {
    res.redirect('/userProfile')
  }).catch((existingUser) => {
    if (existingUser) {
      req.session.editErr = "Phone number or Email address already in use"
      res.redirect('/editProfile')
    }
  })
})
router.get('/userAddress', verifyUserLogin, async (req, res) => {
  console.log("hhhaaa");
  console.log(loggedUser._id);
  let address = await addressHelpers.getUserAddress(loggedUser._id)
  console.log(address);
  res.render('user/userAdress', { users: true, userfoot: true, userhead: true, address, loggedUser, cartCount })
})
router.get('/addAddress', verifyUserLogin, (req, res) => {
  res.render('user/addAddress', { users: true, userfoot: true, userhead: true, loggedUser, cartCount })
})
router.post('/addAddress', (req, res) => {
  addressHelpers.addAddress(req.body).then(() => {
    res.redirect('/userAddress')
  })
})


router.get('/checkoutAddress', verifyUserLogin, (req, res) => {
  res.render('user/checkoutAddress', { users: true, userfoot: true, userhead: true, loggedUser, cartCount })
})
router.post('/checkoutAddress', (req, res) => {
  addressHelpers.addAddress(req.body).then(() => {
    res.redirect('/checkout')
  })
})

router.get('/deleteaddress/:id', verifyUserLogin, (req, res) => {
  let addressId = req.params.id
  addressHelpers.deleteAddress(addressId).then(() => {
    res.redirect('/userAddress')
  }).catch((err) => {
    res.render('error')
  })

})
router.get('/editaddress/:id', verifyUserLogin, (req, res) => {
  addressHelpers.getaddress(req.params.id).then((address) => {
    res.render('user/editAddress', { users: true, userfoot: true, userhead: true, loggedUser, address, cartCount })
  }).catch((err) => {
    res.render('error')
  })


})
router.post('/editaddress/:id', verifyUserLogin, (req, res) => {
  addressHelpers.editAddress(req.params.id, req.body).then(() => {
    res.redirect('/userAddress')
  })
})
router.get('/change-password', verifyUserLogin, (req, res) => {
  logged = req.session.userDetails
  res.render('user/changePassword', { users: true, userfoot: true, userhead: true, loggedUser, "changePassworderr1": req.session.resetErr, "changepassworderr2": req.session.passwordMatchEr, cartCount })

  req.session.resetErr = false
  req.session.passwordMatchEr = false
})

var passwordSuccess
router.post('/changepassword', (req, res) => {

    userHelpers.changePassword(logged._id, req.body).then(() => {
      res.redirect('/userProfile')
      passwordSuccess = true
    }).catch((err) => {

      req.session.resetErr = "Enter correct password"

      res.redirect('/change-password')
    })
  
})
router.get('/categoryWise/:id', verifyUserLogin3, (req, res) => {
  let loggedUser = req.session.userDetails

  categoryHelpers.getCategoryWiseProducts(req.params.id).then((products) => {
    categoryHelpers.getAllCategories().then((category) => {
      brandsHelpers.getAllBrands().then((brands) => {
        res.render('user/categoryWiseList', { users: true, userfoot: true, userhead: true, cartCount, products, category, brands, loggedUser })
      })
    })
  }).catch((err) => {
    res.render('error')
  })
})
router.get('/brandWise/:id', verifyUserLogin3, (req, res) => {
  let loggedUser = req.session.userDetails

  brandsHelpers.getBrandWiseProducts(req.params.id).then((products) => {
    categoryHelpers.getAllCategories().then((category) => {
      brandsHelpers.getAllBrands().then((brands) => {
        res.render('user/categoryWiseList', { users: true, userfoot: true, userhead: true, cartCount, products, category, brands, loggedUser })
      })
    })
  }).catch((err) => {
    res.render('error')
  })
})
router.get('/viewOrder/:id', verifyUserLogin,(req, res) => {

  userHelpers.getOrderProduct(req.params.id).then((products) => {
    console.log(products);
    res.render('user/view-order-products', { loggedUser, users: true, userfoot: true, userhead: true, products, cartCount })
  }).catch((err) => {
    res.render('error')
  })
})

module.exports = router;
