document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


   // I add un gestionnaire d'evenement pour l'envoi du mail
  document.querySelector('#compose-form').addEventListener('submit',       function(event)       {
    event.preventDefault();

    //      mwen rekipere vale fomile                    a 
    const recipients =          document.querySelector('#compose-recipients').value;


    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    // Envoyer la requête POST
    fetch('/emails', {
      method: 'POST',

      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body:      body
      }),


      headers: {
        'Content-Type': 'application/json'
      }
    })


    .then(response =>   response.json())
    .then(result => {
      // Afficher le résultat ou recharger la boîte de réception
      if (result.message) {
        load_mailbox('sent');

      } else if (result.error) {
        alert(result.error);
      }
    });
  });


  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


    // fe yon reket pou rekipere email         bwat 
    
  fetch(`/emails/${mailbox}`)
    .then(response =>       response.json())
    .then(emails => {
      

      //afiche chak email nan bwat lan
      emails.forEach(email => {

        
        const element = document.createElement('div');
        element.className = 'email-item';
        element.innerHTML = `
          <strong>${email.sender}</strong> - ${email.subject}
          <span style="float:right;">${email.timestamp}</span>
        `;
        
        // ou ka ajoute lot enfomasyon la, klike la pou we
        document.querySelector('#emails-view').appendChild(element);
      });
    });
}


function load_mailbox(mailbox) {
  

  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  


  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Requête GET vers l'API pour récupérer les derniers emails de la boîte
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      


      emails.forEach(email => {
        const element = document.createElement('div');
        element.className = 'email-item';
        element.innerHTML = `
          <strong>${email.sender}</strong> - ${email.subject}
          <span style="float:right;">${email.timestamp}</span>
        `;
        document.querySelector('#emails-view').appendChild(element);
      });

      
    });
}



