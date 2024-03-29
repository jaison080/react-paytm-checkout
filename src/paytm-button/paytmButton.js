import React, { useEffect, useState } from "react";
const PaytmChecksum = require("./paytmChecksum");
const https = require("https");
require('dotenv').config()
export function PaytmButton() {
  const [paymentData, setPaymentData] = useState({
    token: "",
    order: "",
    mid: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialize = () => {
    let orderId = "Order_" + new Date().getTime();

    // Sandbox Credentials
    let mid = process.env.REACT_APP_MID; // Merchant ID
    let mkey = process.env.REACT_APP_MKEY; // Merhcant Key
    var paytmParams = {};
console.log(mid, mkey)
    paytmParams.body = {
      requestType: "Payment",
      mid: mid,
      websiteName: "WEBSTAGING",
      orderId: orderId,
      callbackUrl: "https://merchant.com/callback",
      txnAmount: {
        value: 100,
        currency: "INR",
      },
      userInfo: {
        custId: "1001",
      },
    };

    PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      mkey
    ).then(function (checksum) {
      console.log(checksum);
      paytmParams.head = {
        signature: checksum,
      };

      var post_data = JSON.stringify(paytmParams);

      var options = {
        /* for Staging */
        hostname: "securegw-stage.paytm.in" /* for Production */,

        // hostname: 'securegw.paytm.in',

        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on("data", function (chunk) {
          response += chunk;
        });
        post_res.on("end", function () {
          console.log("Response: ", response);
          // res.json({data: JSON.parse(response), orderId: orderId, mid: mid, amount: amount});
          setPaymentData({
            ...paymentData,
            token: JSON.parse(response).body.txnToken,
            order: orderId,
            mid: mid,
            amount: 100,
          });
        });
      });

      post_req.write(post_data);
      post_req.end();
    });
  };

  const makePayment = () => {
    setLoading(true);
    var config = {
        root:"",
           data:{
              orderId:paymentData.order,
              amount:paymentData.amount, // total price
              token:paymentData.token,
              tokenType:"TXN_TOKEN",
            userDetail:{
                 mobileNumber:"",
                name:""
              }
           },
           merchant:{
              mid:paymentData.mid,
              name:"Nitin Khan D'souza",
              logo:"",
              redirect:true,
              callbackUrl:"",
              hidePaytmBranding:false
           },
           "mapClientMessage":{
         
           },
           "labels":{
         
           },
           payMode:{
              labels:{
         
              },
              filter:[
         
              ],
              order:[
                 "LOGIN",
                 "CARD",
                 "NB",
                 "UPI"
              ]
           },
      handler: {
        transactionStatus: function transactionStatus(paymentStatus) {
          console.log("paymentStatus => ", paymentStatus);
          setLoading(false);
        },
        notifyMerchant: function notifyMerchant(eventName, data) {
          console.log("Closed");
          setLoading(false);
        },
      },
    };

    if (window.Paytm && window.Paytm.CheckoutJS) {
      // initialze configuration using init method
      window.Paytm.CheckoutJS.init(config)
        .then(function onSuccess() {
          console.log("Before JS Checkout invoke");
          // after successfully update configuration invoke checkoutjs
          window.Paytm.CheckoutJS.invoke();
        })
        .catch(function onError(error) {
          console.log("Error => ", error);
        });
    }
  };

  return (
    <div>
      {loading ? (
        <img src="https://c.tenor.com/I6kN-6X7nhAAAAAj/loading-buffering.gif" alt="Loader"/>
      ) : (
        <button onClick={makePayment}>Pay Now</button>
      )}
    </div>
  );
}
