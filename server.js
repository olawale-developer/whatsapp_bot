const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const nairaEst = require('./nairaEst.js')
const {sendMessage} = require('./nairaEst.js')
let menuChoice = {};
let sessions = {}

const app = express();
app.use(bodyParser.json());


// const to = '2347035194443';

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


// Webhook to receive messages
app.post('/webhook', async (req, res) => {
    const { messages } = req.body.entry[0].changes[0].value;
    if (messages) {
        const from = messages[0].from; // Sender's WhatsApp number
        const msg_body = messages[0].text.body; // Message text
        console.log(msg_body)
        // Handle greetings
        if (!sessions[from]) {
             sessions[from] = {}
         }

        if (msg_body.toLowerCase() === 'hi' || msg_body.toLowerCase() === 'hello' || msg_body.toLowerCase() === 'hey') {
            await mainMenu(from);
        }
        if (menuChoice[from] === 'subMenu') {
            await subMenu(from,msg_body)
        } else if(menuChoice[from] === 'transferMoneyMenu'){
              await transferMoneyMenu(from,msg_body)
        } else if (menuChoice[from] === 'SelectNetwork') {
            handleSelectNetwork(from,msg_body)
        }else if (menuChoice[from] === 'usdtpayment') {
            handleUsdtCryptos(from,msg_body)
        }else if (menuChoice[from] === 'Selectcurrency') {
            nairaEst.handleSelectCurrency(msg_body,from,sessions,menuChoice)
        }


        // // Handle button responses
        // if (messages[0].interactive) {
        //     const buttonPayload = messages[0].interactive.button_reply.id; // ID of the clicked button

        //     if (buttonPayload === 'buy_car') {
        //      //   await sendBrandList(from);
        //     }
        // } transactCrypto
    }
    res.sendStatus(200);
});




async function mainMenu(to) {
    db.query(`SELECT * FROM 2Settle_ExchangeRate`, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return;
        }
        console.log(to)
        
        const raw = results.map((row) => `${row.rate}`);
        const merchant = results.map((row) => row.merchant_rate.toString())
        const profit_rate = results.map((row) => row.profit_rate.toString())

        // storing the profit and merchant rate from db to a sessions management object 
        sessions[to]['profit_rate'] = `₦${profit_rate.toLocaleString()}`
        sessions[to]['merchant_rate'] = `₦${merchant.toLocaleString()}`
    
        // the calculation of the 0.8 %  minus the rate 
        const array_rate = raw.toString()
        const numRate = Number(array_rate)
        const percentage = 0.8;
        const increase = (percentage / 100) * numRate;
        const rate = numRate - increase
       const fixedRate = Number(rate.toFixed(2))
        // storing the rate and firstName to a sessions management object 
        sessions[to]['mainRate'] = fixedRate.toLocaleString()
        const menuOptions = [
            '1. Transact Crypto',
            '2. Request for paycard',
            '3. Customer support',
            '4. Transaction ID',
            '5. Reportly'
        ];
        const menuMessage = 'Here is your Menu:\n' + menuOptions.map(option => '\u200B' + option).join('\n');
    
        const data = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: `Today Rate: ₦${sessions[to]['mainRate']}/$1 \n\nWelcome to 2SettleHQ, how can I help you today?`  // Message content
            }
        };
        sendMessage(data)
            .then(() => {
                const data = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: {
                        body: menuMessage  // Message content
                    }
                };

                sendMessage(data)
            })
        menuChoice[to] = 'subMenu'
    })
}

async function subMenu(to,choice) {
if (choice === '1') {
    const menuOptions = [
'1. Transfer money',
'2. Send Gift',
'3. Request for payment',
'0. Go back',
];  
    const menuMessage = 'Here is your Menu:\n' + menuOptions.map(option => '\u200B' + option).join('\n');
        const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
            body: menuMessage  // Message content
        }
};
    menuChoice[to] ='transferMoneyMenu'
    sendMessage(data)
}



  
}

async function transferMoneyMenu(to,choice) {
if (choice === '1') {
    const menuOptions = [
'1. Bitcoin (BTC)',
'2. Ethereum (ETH)',
'3. BINANCE (BNB)',
'4. TRON (TRX)',
'5. USDT',
'0. Go back',
'00. Exit',
];  
    const menuMessage = 'Pay with:\n' + menuOptions.map(option => '\u200B' + option).join('\n');
        const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
            body: menuMessage  // Message content
        }
};

    sendMessage(data)
}
 menuChoice[to] ='SelectNetwork'
}

// this function handle how a user like to estimate their payment
function estimation(to) {
   const menuOptions = [
      '1. Naira',
      '2. Dollar ',
      '3. Crypto',
      '00. Exit'
    ];
        const menuMessage = 'Here is your Menu:\n' + menuOptions.map(option => '\u200B' + option).join('\n');
    
        const data = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: `How would you like to estimate your ${sessions[to]['cryptoasset']} (${sessions[to]['network']})?`  // Message content
            }
        };
        sendMessage(data)
            .then(() => {
                const data = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: {
                        body: menuMessage  // Message content
                    }
                };

                sendMessage(data)
            })
     menuChoice[to] = 'Selectcurrency'
}

 function usdtNetwork(to) {
  const menuOptions = [
    '1. ERC20',
    '2. TRC20',
    '3. BEP20',
    '0. Go back',
    '00. Exit'
  ];
     const menuMessage = 'select Network:\n' + menuOptions.map(option => '\u200B' + option).join('\n');
     const data = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: {
                        body: menuMessage  // Message content
                    }
                };

                sendMessage(data)
      menuChoice[to] = 'usdtpayment'
 }


 function handleSelectNetwork(to,choice){
     if (choice === '1') {
         sessions[to]['cryptoNetwork'] = 'BTCUSDT'
         sessions[to]['cryptoasset'] = 'BTC'
         sessions[to]['network'] = 'BTC'
         estimation(to)
     } else if (choice === '2') {
         sessions[to]['cryptoNetwork'] = 'ETHUSDT'
         sessions[to]['cryptoasset'] = 'ETH'
         sessions[to]['network'] = 'ERC20'
         estimation(to)
     } else if (choice === '3') {
         sessions[to]['cryptoNetwork'] = 'BNBUSDT'
         sessions[to]['cryptoasset'] = 'BNB'
         sessions[to]['network'] = 'BEP20'
         estimation(to)
     } else if (choice === '4') {
         sessions[to]['cryptoNetwork'] = 'TRXUSDT'
         sessions[to]['cryptoasset'] = 'TRX'
         sessions[to]['network'] = 'TRC20'
         estimation(to)
     } else if (choice === '5') {
         sessions[to]['cryptoNetwork'] = 'USDT'
         sessions[to]['cryptoasset'] = 'USDT'
         usdtNetwork(to)
     }
//   else if(choice === '00') {
//    exitMenu(chatId,choice,bot,menuChoice,sessions)
//    }
//   else{
//     const message = 'Enter a valid options provided. Try again \n' + '00. Exit'
//   }
 }

 // this function display the options of how user will like to estimate their payment in usdt,this is the fourth step when user choose usdt after user click on transact crypto 
function handleUsdtCryptos(to,choice) { 
  if(choice === '1'){
    sessions[to]['network'] =  'ERC20'
    estimation(to)
  }  else if (choice === '2'){
    sessions[to]['network'] = 'TRC20'
     estimation(to)
  }else if(choice ==='3'){
    sessions[to]['network'] = 'BEP20'
     estimation(to)
  } else if (choice === '0'){
//     selectCoin(chatId, bot)
//    menuChoice[chatId] = 'selectnetwork'
  }else if (choice === '00'){
 // exitMenu (chatId,choice,bot,menuChoice,sessions)
  }
  else{
    const message = 'Enter a valid options provided. Try again \n' + '0. Go back \n' + '00. Exit'
    bot.sendMessage(chatId, message);
    
  }
}

// app.get('/webhook', (req, res) => {
//     const VERIFY_TOKEN = 'Sirfitech';
//     const mode = req.query['hub.mode'];
//     const token = req.query['hub.verify_token'];
//     const challenge = req.query['hub.challenge'];
   
//     if (mode && token === VERIFY_TOKEN) {
//         res.status(200).send(challenge);
//     } else {
//         res.sendStatus(403);
     
//     }
// });



// Server listening on port 3000
app.listen(3001, () => {
    console.log('Server is running on port 3001');
});






