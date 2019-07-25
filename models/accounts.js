var mongoose = require('mongoose');

const AccountSchema = mongoose.Schema({
  username : String,
  password : String,
  accountDetails : {
    args : {
      accountUUID: String,
      accountId: String,
      accountType : String,
      ownerDetails: {
        OwnerName: String,
        Contact: {
          PhoneNumber: String,
          Email: String
        },
        CitizenshipID: String,
        PermanentAddress: String
      },
      balance: {
        amount: Number
      }
    }
  },
  createDate : {
    type : Date,
    default : Date.now
  }
});

module.exports = mongoose.model('Accounts', AccountSchema);
