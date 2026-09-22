// External dependencies
const express = require('express');
const router = express.Router();
const axios = require('axios');

console.log('*** V13 ROUTES LOADED ***');

router.get(/start/, function (req, res) {

  // The regex finds all pages with 'start' in it, so we need to check for 'your-start-date'...
  if (req.originalUrl.indexOf('your-start-date') === -1) {

    console.log('*** DATA RESET ***');

    const addressMethod = req.session.data.addressMethod || 'select';
    const debug = req.session.data.debug || 'false';
    const route = req.session.data.route;

    req.session.data = {};
    req.session.data.addressMethod = addressMethod;
    req.session.data.debug = debug;
    if (route) {
      req.session.data.route = route;
    }

  }

  res.render(req.originalUrl.split('?')[0].substring(1));

});

router.post(/is-your-medicine-covered/, function (req, res) {

  let redirect = 'other-prescription-items';

  switch (req.session.data.medicinesCovered) {

    case 'no':
      redirect = 'medicine-not-covered';
      break;

    case 'some':
      redirect = 'filter-ppc';
      break;

  }

  res.redirect(redirect);

});


router.post('/filter-ppc', function (req, res) {

  if (req.body.action === 'continue') {
    return res.redirect('third-party');
  }

  if (req.body.action === 'buyPPC') {
    return res.redirect('https://buy-prescription-prepayment-certificate.nhsbsa.nhs.uk/start');
  }

});
router.post(/other-prescription-items/, function (req, res) {
  let redirect = (req.session.data.otherPrescriptionItems === 'yes') ? 'filter-ppc' : 'where-you-collect';
  res.redirect(redirect);
});

router.post(/third-party/, function (req, res) {
  res.redirect('where-you-collect');
});

router.post(/where-you-collect/, function (req, res) {
  let redirect = (req.session.data.country !== 'england') ? 'may-be-entitled' : 'date-of-birth';
  res.redirect(redirect);
});

router.post(/may-be-entitled/, function (req, res) {
  let redirect = (req.session.data.reallyStillBuyHRTPPC === 'yes') ? 'date-of-birth' : 'chosen-not-to-buy';
  res.redirect(redirect);
});

router.post(/date-of-birth/, function (req, res) {
  let redirect = (req.session.data.returnToCYA === 'true') ? 'check-your-answers?returnToCYA=false' : 'name';
  res.redirect(redirect);
});

router.post(/name/, function (req, res) {

  let addressMethod = 'radios';
  let redirect = (req.session.data.returnToCYA === 'true') ? 'check-your-answers?returnToCYA=false' : addressMethod + '/postcode';
  req.session.data.showErrors = false;
  res.redirect(redirect);

});

router.post(/radios\/postcode-address/, function (req, res) {
  let defaultRoute = (req.session.data.addressSearchResults && req.session.data.addressSearchResults.length === 1) ? '../nhs-number' : 'postcode-confirm';
  let redirect = (req.session.data.returnToCYA === 'true') ? '../check-your-answers?returnToCYA=false' : defaultRoute;
  res.redirect(redirect);
});

router.post(/radios\/postcode-confirm/, function (req, res) {
  res.redirect('../nhs-number');
});

router.post(/manual-address/, function (req, res) {

  req.session.data.addressMethod = 'manual';

  // Clear select address method
  delete req.session.data.addressSearchResults
  delete req.session.data.postcode;

  // Concatenate the address as typed out...
  const addressParts = ['addressLine1', 'addressLine2', 'addressTown', 'addressCounty', 'addressPostcode'];
  const address = [];

  addressParts.forEach(function (part) {
    if (req.session.data[part] && req.session.data[part].trim()) {
      address.push(req.session.data[part]);
    }
  });

  req.session.data.address = address.join(', ');

  let redirect = (req.session.data.returnToCYA === 'true') ? 'check-your-answers?returnToCYA=false' : 'nhs-number';
  res.redirect(redirect);

});

router.post(/nhs-number/, function (req, res) {
  let redirect = (req.session.data.returnToCYA === 'true') ? 'check-your-answers?returnToCYA=false' : 'your-start-date';
  res.redirect(redirect);
});

router.post(/your-start-date/, function (req, res) {
  let redirect = (req.session.data.returnToCYA === 'true') ? 'check-your-answers?returnToCYA=false' : 'get-certificate-by-email';
  res.redirect(redirect);
});

router.post(/get-certificate-by-email/, function (req, res) {
  res.redirect('check-your-answers');
});



// RADIO ADDRESS METHOD 
console.log('### REGISTERING POSTCODE HANDLER ###');

// router.get(/postcode-radios-handler/, function (req, res) {

//     console.log('POSTCODE HANDLER HIT')

//     console.log('QUERY:', req.query)
//     console.log('SESSION:', req.session.data)

//   // Prep the variables
//   let addressSearchPostcode = req.session.data.postcode.split(' ').join('').toUpperCase();
//   const addressSearchBuildingNumberOrName = req.session.data.buildingNumberOrName || '';
//   const apiKey = process.env.POSTCODEAPIKEY;
//   const regex = RegExp('^([A-PR-UWYZa-pr-uwyz](([0-9](([0-9]|[A-HJKSTUW])?)?)|([A-HK-Ya-hk-y][0-9]([0-9]|[ABEHMNPRVWXY])?)) ?[0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2})$', 'i');
//   addressSearchPostcode = ( regex.test(addressSearchPostcode) ) ? addressSearchPostcode : '';

//   const updateResults = ( arr ) => {
//     req.session.data.addressSearchResults = arr;
//   };

//   const toTitleCase = ( str ) => {
//     return str.replace( /\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); } );
//   }

//   const formatAddress = ( address ) => {

//     const formattedAddress = [];
//     const addressParts = address.split(', ');
//     addressParts.forEach( ( part, i ) => {
//       if( i !== (addressParts.length - 1) ){
//         formattedAddress.push( toTitleCase( part ) );
//       } else {
//         formattedAddress.push( part );
//       }
//     });

//     return formattedAddress.join(', ');

//   };

//   let baseURL = '';

//   if( addressSearchBuildingNumberOrName ){
//     baseURL = 'https://api.os.uk/search/places/v1/find?query=' + encodeURI(addressSearchBuildingNumberOrName);
//   }

//   if( addressSearchPostcode ){
//     baseURL = 'https://api.os.uk/search/places/v1/postcode?postcode=' + encodeURI(addressSearchPostcode);
//   }

//   // Make the call
//   if( baseURL && apiKey ){

//     let url = baseURL + '&key=' + apiKey;

//     axios.get( url ).then( response => {

//       let filteredResults = [];

//       if( Array.isArray( response.data.results ) ){

//         response.data.results.forEach(function(result){

//           let resultPostcode = result.DPA.POSTCODE.split(' ').join('').toUpperCase();

//           let obj = { 
//             'text' : formatAddress( result.DPA.ADDRESS ),
//             'value' : formatAddress( result.DPA.ADDRESS )
//           };

//           if( addressSearchPostcode ){

//             if( addressSearchPostcode.indexOf(resultPostcode) === 0 ){

//               let bnon = addressSearchBuildingNumberOrName.trim().toUpperCase();
//               if( bnon ){

//                 // WE HAVE A POSTCODE AND A BUILDING NAME/NUMBER, TRY TO NARROW THE RESULTS DOWN...

//                 if( result.DPA.BUILDING_NAME ){

//                   if( result.DPA.SUB_BUILDING_NAME ){
//                     // We can check the SUB_BUILDING_NAME field as well...
//                     if( result.DPA.SUB_BUILDING_NAME.indexOf(bnon) > -1 || result.DPA.BUILDING_NAME.indexOf(bnon) > -1 ){
//                       filteredResults.push(obj);
//                     }
//                   } else {
//                     // We can only check the BUILDING_NAME field...
//                     if( result.DPA.BUILDING_NAME.indexOf(bnon) > -1 ){
//                       filteredResults.push(obj);
//                     }
//                   }

//                 } else if( result.DPA.BUILDING_NUMBER ) {

//                     if( result.DPA.BUILDING_NUMBER === String(bnon) ){
//                       filteredResults.push(obj);
//                     }

//                 }
//               } else {

//                 // WE HAVE A POSTCODE, BUT NO BUILDING NAME/NUMBER, ALLOW EVERYTHING...
//                 filteredResults.push(obj);
//               }

//             }

//           } else {

//             // WE DON'T HAVE A POSTCODE, ONLY BUILDING NAME/NUMBER, ALLOW ANYTHING...
//             filteredResults.push(obj);

//          }

//         });

//       }

//       updateResults( filteredResults );
//       res.redirect('postcode-address');


//     }).catch( (error) => { console.log( error ); });


// } else {

//   updateResults([]);
//   res.redirect('postcode?showErrors=true');

// }

// });

// router.get('/radios/postcode-radios-handler', function (req, res) {

//     console.log('=================================');
//     console.log('V13 POSTCODE HANDLER HIT');
//     console.log('QUERY:', req.query);
//     console.log('SESSION:', req.session.data);
//     console.log('=================================');

//     res.send('V13 POSTCODE HANDLER WORKS');

// });

router.get('/radios/postcode-radios-handler', function (req, res) {

  console.log('POSTCODE HANDLER HIT');
  console.log('QUERY:', req.query);

  // Get values submitted by the form
  let addressSearchPostcode = (req.query.postcode || '')
    .replace(/\s/g, '')
    .toUpperCase();

  const addressSearchBuildingNumberOrName =
    req.query.buildingNumberOrName || '';

  // Save submitted values into session
  req.session.data.postcode = req.query.postcode || '';
  req.session.data.buildingNumberOrName =
    addressSearchBuildingNumberOrName;

  console.log('POSTCODE:', addressSearchPostcode);
  console.log('BUILDING:', addressSearchBuildingNumberOrName);

  // Validate postcode
  const regex = /^[A-Z]{1,2}[0-9][0-9A-Z]?[0-9][A-Z]{2}$/i;

  addressSearchPostcode =
    regex.test(addressSearchPostcode)
      ? addressSearchPostcode
      : '';

  console.log('VALIDATED POSTCODE:', addressSearchPostcode);

  const updateResults = (arr) => {
    req.session.data.addressSearchResults = arr;
  };

  const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() +
        txt.substr(1).toLowerCase();
    });
  };

  const formatAddress = (address) => {

    const formattedAddress = [];
    const addressParts = address.split(', ');

    addressParts.forEach((part, i) => {

      if (i !== (addressParts.length - 1)) {

        formattedAddress.push(
          toTitleCase(part)
        );

      } else {

        formattedAddress.push(part);

      }

    });

    return formattedAddress.join(', ');
  };

  let baseURL = '';

  if (addressSearchBuildingNumberOrName) {

    baseURL =
      'https://api.os.uk/search/places/v1/find?query=' +
      encodeURIComponent(addressSearchBuildingNumberOrName);

  }

  if (addressSearchPostcode) {

    baseURL =
      'https://api.os.uk/search/places/v1/postcode?postcode=' +
      encodeURIComponent(addressSearchPostcode);

  }

  const apiKey = process.env.POSTCODEAPIKEY;

  // No valid search criteria
  if (!baseURL || !apiKey) {

    console.log('No API request made');
    console.log('API key present:', !!apiKey);

    updateResults([]);

    return res.redirect('postcode?showErrors=true');
  }

  const url = baseURL + '&key=' + apiKey;

  console.log('Calling OS Places API');

  axios.get(url)
    .then(response => {

      let filteredResults = [];

      if (Array.isArray(response.data.results)) {

        response.data.results.forEach(function (result) {

          if (!result.DPA) {
            return;
          }

          const resultPostcode =
            result.DPA.POSTCODE
              .replace(/\s/g, '')
              .toUpperCase();

          const obj = {
            text: formatAddress(result.DPA.ADDRESS),
            value: formatAddress(result.DPA.ADDRESS)
          };

          if (addressSearchPostcode) {

            if (
              addressSearchPostcode.indexOf(resultPostcode) === 0
            ) {

              const bnon =
                addressSearchBuildingNumberOrName
                  .trim()
                  .toUpperCase();

              if (bnon) {

                if (result.DPA.BUILDING_NAME) {

                  if (result.DPA.SUB_BUILDING_NAME) {

                    if (
                      result.DPA.SUB_BUILDING_NAME
                        .toUpperCase()
                        .indexOf(bnon) > -1 ||
                      result.DPA.BUILDING_NAME
                        .toUpperCase()
                        .indexOf(bnon) > -1
                    ) {
                      filteredResults.push(obj);
                    }

                  } else {

                    if (
                      result.DPA.BUILDING_NAME
                        .toUpperCase()
                        .indexOf(bnon) > -1
                    ) {
                      filteredResults.push(obj);
                    }

                  }

                } else if (result.DPA.BUILDING_NUMBER) {

                  if (
                    result.DPA.BUILDING_NUMBER ===
                    String(bnon)
                  ) {
                    filteredResults.push(obj);
                  }

                }

              } else {

                // Postcode only
                filteredResults.push(obj);

              }

            }

          } else {

            // Building name/number only
            filteredResults.push(obj);

          }

        });

      }

      console.log(
        'ADDRESS RESULTS:',
        filteredResults.length
      );

      updateResults(filteredResults);

      res.redirect('postcode-address');

    })
    .catch(error => {

      console.log('OS PLACES API ERROR:', error);

      updateResults([]);

      res.redirect('postcode?showErrors=true');

    });

});

module.exports = router;
