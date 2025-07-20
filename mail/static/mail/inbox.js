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
  document.querySelector('#email-detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none'; 
  
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

  
   document.querySelector('#email-detail-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  
  //reket ve api pou jwenn denye email bwat lan
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())

    
    .then(emails => {
      


      emails.forEach(email => {
        const element = document.createElement('div');
        element.className = 'email-item';
        element.style.border = '1px solid #ccc';
        element.style.padding = '10px';
        element.style.margin = '5px 0';
        element.style.borderRadius = '5px';
        


        element.style.background = email.read ? '#f0f0f0' : '#fff';

        element.innerHTML = `
          <strong>De : ${email.sender}</strong><br>


          <span>Sujet : ${email.subject}</span><br>
          <span style="float:right;">${email.timestamp}</span>
        `;


        element.addEventListener('click',    function() {

          if (mailbox !== 'sent') {
              const btn = document.querySelector('#archive-btn') || document.querySelector('#unarchive-btn');
              if (btn) {
                btn.addEventListener('click', function() {
                  fetch(`/emails/${email_detail.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ archived: !email_detail.archived })
                  })
                  .then(() => load_mailbox('inbox'));
                });
              }
            }

          fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true })
          });


          document.querySelector('#emails-view').style.display =      'none';
              document.querySelector('#compose-view').style.display = 'none';
          
          document.querySelector('#email-detail-view').style.display = 'block';
        fetch(`/emails/${email.id}`)


          .then(response => response.json())
          .then(email_detail => {

            
            //mete bouton achive ak dezaktive si se pa yon mail yo voye
            let archiveButton = '';
            if (mailbox !== 'sent') {
              if (!email_detail.archived) {
                archiveButton = `<button id="archive-btn" class="btn btn-sm btn-outline-secondary">Archiver</button>`;
              } else {
                archiveButton = `<button id="unarchive-btn" class="btn btn-sm btn-outline-secondary">Désarchiver</button>`;
              }
            }
            
            //afiche kontni email + bouton
            
            document.querySelector('#email-detail-view').innerHTML = `
              <div style="border:1px solid #ccc; padding:15px; border-radius:5px;">
                <strong>De :</strong> ${email_detail.sender}<br>
                <strong>À :</strong> ${email_detail.recipients.join(', ')}<br>
                <strong>Sujet :</strong> ${email_detail.subject}<br>
                <strong>Date :</strong> ${email_detail.timestamp}<br>
                <hr>
                <p>${email_detail.body}</p>
                ${archiveButton}
              </div>
            `;
             
            //ajoute jesyone evenman
            if (mailbox !== 'sent') {
                const btn = document.querySelector('#archive-btn') || document.querySelector('#unarchive-btn');
                if (btn) {
                  btn.addEventListener('click', function() {
                    fetch(`/emails/${email_detail.id}`, {
                      method: 'PUT',
                      body: JSON.stringify({ archived: !email_detail.archived })
                    })
                    .then(() => load_mailbox('inbox'));
                  });
                }
              }
             

            //Afiche vue pou email lan
            document.querySelector('#email-detail-view').innerHTML = `
              <div style="border:1px solid #ccc;            padding:15px; border-radius:5px;">
                <strong>De :</strong> ${email_detail.sender}<br>

                <strong>À :</strong>     ${email_detail.recipients.join(', ')}<br>
                <strong>Sujet :</strong> ${email_detail.subject}<br>

                <strong>Date :</strong> ${email_detail.timestamp}   <br>
                <hr>
                <p>${email_detail.body}</p>
              </div>
            `;
          });
        });

        document.querySelector('#emails-view').appendChild(element);
      });


    });
}



