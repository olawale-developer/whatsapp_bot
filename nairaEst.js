const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
// Function to send a message using WhatsApp Cloud API
async function sendMessage(data) {
    await axios.post(
        `https://graph.facebook.com/v16.0/${process.env.phoneNumberId}/messages`,
        data,
        {
            headers: {
                Authorization: `Bearer ${process.env.token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}



function handleresponse(message,to) {
     const data = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: {
                        body: message  // Message content
                    }
                };

    sendMessage(data)
}


// this function handle the naira amount user to use to estimate
function naira_currency(to,sessions,menuChoice) { 
   const message = `Enter the amount you want to send in Naira value \n\n \
NOTE: Maximum payment is 2 million naira and minium payment is 20,000 naira .\
    \n 0. Go back \
    \n 00. Exit`
    handleresponse(message,to)
     sessions[to]['estimate'] = 'Naira'
      menuChoice[to] = 'nairamount'
}


// This function tell user to input the amount they want to use for estimation.
function handleSelectCurrency(choice,to,sessions,menuChoice) { 
  
  sessions[to]['minusCharges'] = 'Charge from the amount'
  sessions[to]['addCharges'] = 'Add charges to the amount'

    if(choice === '1'){
    naira_currency(to,sessions,menuChoice)
    } else if (choice === '2') {   
   dollar_currency(to)
    } else if (choice === '3') {
     crypto_currency(to)
    }
    else if (choice === '00') {
      exitMenu (chatId,choice,bot,menuChoice,sessions)
    }
    else{
      const message = 'Enter a valid options provided. Try again \n' + '00. Exit'
      bot.sendMessage(chatId, message);
    }
}



module.exports =  {
    handleSelectCurrency,
    sendMessage
}