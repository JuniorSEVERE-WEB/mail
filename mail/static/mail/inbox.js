document.addEventListener('DOMContentLoaded', () => {
  const inboxBtn = document.querySelector('#inbox');
  const sentBtn = document.querySelector('#sent');
  const archivedBtn = document.querySelector('#archived');
  const composeBtn = document.querySelector('#compose');

  if (inboxBtn) inboxBtn.addEventListener('click', () => load_mailbox('inbox'));
  if (sentBtn) sentBtn.addEventListener('click', () => load_mailbox('sent'));
  if (archivedBtn) archivedBtn.addEventListener('click', () => load_mailbox('archive'));
  if (composeBtn) composeBtn.addEventListener('click', compose_email);

  // handle compose form submit (send email)
  const composeForm = document.querySelector('#compose-form');
  if (composeForm) {
    composeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      send_email();
    });
  }

  // Load inbox by default
  load_mailbox('inbox');
});

function compose_email() {
  const emailsView = document.querySelector('#emails-view');
  const detailView = document.querySelector('#email-detail-view');
  const composeView = document.querySelector('#compose-view');

  if (emailsView) emailsView.style.display = 'none';
  if (detailView) detailView.style.display = 'none';
  if (composeView) {
    composeView.style.display = 'block';
    const r = document.querySelector('#compose-recipients');
    const s = document.querySelector('#compose-subject');
    const b = document.querySelector('#compose-body');
    if (r) { r.value = ''; r.removeAttribute('disabled'); }
    if (s) s.value = '';
    if (b) b.value = '';
  }
}

// send email (used for new email and replies)
function send_email() {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
    .then(({ ok, status, data }) => {
      if (!ok) {
        // show simple alert on error
        alert(data.error || 'Unable to send email.');
        return;
      }
      // on success load Sent mailbox
      load_mailbox('sent');
    })
    .catch(error => {
      console.error('Error sending email:', error);
      alert('Error sending email.');
    });
}

// helper to open compose with prefilled reply values
function open_compose_prefill(email_detail) {
  const emailsView = document.querySelector('#emails-view');
  const detailView = document.querySelector('#email-detail-view');
  const composeView = document.querySelector('#compose-view');

  if (emailsView) emailsView.style.display = 'none';
  if (detailView) detailView.style.display = 'none';
  if (!composeView) return;

  composeView.style.display = 'block';

  const r = document.querySelector('#compose-recipients');
  const s = document.querySelector('#compose-subject');
  const b = document.querySelector('#compose-body');

  // Recipient: original sender
  if (r) {
    r.value = email_detail.sender;
    r.removeAttribute('disabled');
    r.focus();
  }

  // Subject: prefix with Re: if missing
  if (s) {
    s.value = email_detail.subject && email_detail.subject.startsWith('Re:') ?
      email_detail.subject :
      `Re: ${email_detail.subject || ''}`;
  }

  // Body: include quoted original and place caret before it
  if (b) {
    const quote = `\n\nOn ${email_detail.timestamp}, ${email_detail.sender} wrote:\n${email_detail.body}`;
    b.value = quote;
    // put caret at start so user types above the quoted text
    try {
      b.selectionStart = 0;
      b.selectionEnd = 0;
    } catch (e) { /* ignore */ }
    b.focus();
  }
}

function load_mailbox(mailbox) {
  const emailsView = document.querySelector('#emails-view');
  const composeView = document.querySelector('#compose-view');
  const detailView = document.querySelector('#email-detail-view');

  if (!emailsView) return;

  // Show mailbox, hide others
  emailsView.style.display = 'block';
  if (composeView) composeView.style.display = 'none';
  if (detailView) detailView.style.display = 'none';

  // Title
  const title = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
  emailsView.innerHTML = `<h3>${title}</h3>`;

  // Fetch emails
  fetch(`/emails/${mailbox}`)
    .then(response => {
      if (!response.ok) throw new Error('Network response not ok');
      return response.json();
    })
    .then(emails => {
      // If no emails, show a message
      if (!emails || emails.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'email-empty';
        empty.style.margin = '10px 0';
        empty.textContent = 'No emails to show.';
        emailsView.appendChild(empty);
        return;
      }

      // Render each email
      emails.forEach(email => {
        const element = document.createElement('div');
        element.className = 'email-item';
        element.style.border = '1px solid #ccc';
        element.style.padding = '10px';
        element.style.margin = '5px 0';
        element.style.borderRadius = '5px';
        element.style.cursor = 'pointer';
        element.style.background = email.read ? '#f0f0f0' : '#fff';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'space-between';

        element.innerHTML = `
          <div>
            <strong>${email.sender}</strong>
            <span style="margin-left:10px;">${email.subject}</span>
          </div>
          <div style="color: #666;">${email.timestamp}</div>
        `;

        // Click to view detail
        element.addEventListener('click', () => {
          // Mark as read (best-effort)
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true })
          }).catch(console.error);

          // Show detail view
          emailsView.style.display = 'none';
          if (composeView) composeView.style.display = 'none';
          if (detailView) detailView.style.display = 'block';

          // Fetch full details
          fetch(`/emails/${email.id}`)
            .then(resp => {
              if (!resp.ok) throw new Error('Failed to fetch email detail');
              return resp.json();
            })
            .then(email_detail => {
              // Archive/unarchive button (available for any mailbox)
              let archiveButtonHtml = '';
              if (email_detail.archived) {
                archiveButtonHtml = `<button id="unarchive-btn" class="btn btn-sm btn-outline-secondary">Unarchive</button>`;
              } else {
                archiveButtonHtml = `<button id="archive-btn" class="btn btn-sm btn-outline-secondary">Archive</button>`;
              }

              const replyButtonHtml = `<button id="reply-btn" class="btn btn-sm btn-outline-primary" style="margin-left:8px;">Reply</button>`;

              detailView.innerHTML = `
                <div style="border:1px solid #ccc; padding:15px; border-radius:5px;">
                  <strong>From:</strong> ${email_detail.sender}<br>
                  <strong>To:</strong> ${(email_detail.recipients || []).join(', ')}<br>
                  <strong>Subject:</strong> ${email_detail.subject}<br>
                  <strong>Date:</strong> ${email_detail.timestamp}<br>
                  <hr>
                  <p style="white-space:pre-wrap;">${email_detail.body}</p>
                  ${archiveButtonHtml}
                  ${replyButtonHtml}
                </div>
              `;

              // Reply handler - replace node then attach to avoid duplicate listeners
              const replyBtn = document.querySelector('#reply-btn');
              if (replyBtn) {
                const newReply = replyBtn.cloneNode(true);
                replyBtn.parentNode.replaceChild(newReply, replyBtn);
                newReply.addEventListener('click', () => open_compose_prefill(email_detail));
              }

              // Archive/unarchive handler - replace node then attach
              const archBtn = document.querySelector('#archive-btn') || document.querySelector('#unarchive-btn');
              if (archBtn) {
                const newArch = archBtn.cloneNode(true);
                archBtn.parentNode.replaceChild(newArch, archBtn);
                newArch.addEventListener('click', () => {
                  fetch(`/emails/${email_detail.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ archived: !email_detail.archived })
                  })
                    .then(resp => {
                      if (!resp.ok) throw new Error('Failed to update archived status');
                      // reload the mailbox the user is currently viewing
                      load_mailbox(mailbox === 'archive' ? 'archive' : 'inbox');
                    })
                    .catch(err => {
                      console.error(err);
                      load_mailbox('inbox');
                    });
                });
              }
            })
            .catch(err => {
              console.error('Error fetching email detail:', err);
            });
        });

        emailsView.appendChild(element);
      });
    })
    .catch(error => {
      console.error('Error loading mailbox:', error);
      const msg = document.createElement('div');
      msg.style.color = 'red';
      msg.style.marginTop = '10px';
      msg.textContent = 'Unable to load mailbox.';
      emailsView.appendChild(msg);
    });
}
```// filepath: c:\Users\sever\OneDrive\Bureau\mail\mail\static\mail\inbox.js
document.addEventListener('DOMContentLoaded', () => {
  const inboxBtn = document.querySelector('#inbox');
  const sentBtn = document.querySelector('#sent');
  const archivedBtn = document.querySelector('#archived');
  const composeBtn = document.querySelector('#compose');

  if (inboxBtn) inboxBtn.addEventListener('click', () => load_mailbox('inbox'));
  if (sentBtn) sentBtn.addEventListener('click', () => load_mailbox('sent'));
  if (archivedBtn) archivedBtn.addEventListener('click', () => load_mailbox('archive'));
  if (composeBtn) composeBtn.addEventListener('click', compose_email);

  // handle compose form submit (send email)
  const composeForm = document.querySelector('#compose-form');
  if (composeForm) {
    composeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      send_email();
    });
  }

  // Load inbox by default
  load_mailbox('inbox');
});

function compose_email() {
  const emailsView = document.querySelector('#emails-view');
  const detailView = document.querySelector('#email-detail-view');
  const composeView = document.querySelector('#compose-view');

  if (emailsView) emailsView.style.display = 'none';
  if (detailView) detailView.style.display = 'none';
  if (composeView) {
    composeView.style.display = 'block';
    const r = document.querySelector('#compose-recipients');
    const s = document.querySelector('#compose-subject');
    const b = document.querySelector('#compose-body');
    if (r) { r.value = ''; r.removeAttribute('disabled'); }
    if (s) s.value = '';
    if (b) b.value = '';
  }
}

// send email (used for new email and replies)
function send_email() {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
    .then(({ ok, status, data }) => {
      if (!ok) {
        // show simple alert on error
        alert(data.error || 'Unable to send email.');
        return;
      }
      // on success load Sent mailbox
      load_mailbox('sent');
    })
    .catch(error => {
      console.error('Error sending email:', error);
      alert('Error sending email.');
    });
}

// helper to open compose with prefilled reply values
function open_compose_prefill(email_detail) {
  const emailsView = document.querySelector('#emails-view');
  const detailView = document.querySelector('#email-detail-view');
  const composeView = document.querySelector('#compose-view');

  if (emailsView) emailsView.style.display = 'none';
  if (detailView) detailView.style.display = 'none';
  if (!composeView) return;

  composeView.style.display = 'block';

  const r = document.querySelector('#compose-recipients');
  const s = document.querySelector('#compose-subject');
  const b = document.querySelector('#compose-body');

  // Recipient: original sender
  if (r) {
    r.value = email_detail.sender;
    r.removeAttribute('disabled');
    r.focus();
  }

  // Subject: prefix with Re: if missing
  if (s) {
    s.value = email_detail.subject && email_detail.subject.startsWith('Re:') ?
      email_detail.subject :
      `Re: ${email_detail.subject || ''}`;
  }

  // Body: include quoted original and place caret before it
  if (b) {
    const quote = `\n\nOn ${email_detail.timestamp}, ${email_detail.sender} wrote:\n${email_detail.body}`;
    b.value = quote;
    // put caret at start so user types above the quoted text
    try {
      b.selectionStart = 0;
      b.selectionEnd = 0;
    } catch (e) { /* ignore */ }
    b.focus();
  }
}

function load_mailbox(mailbox) {
  const emailsView = document.querySelector('#emails-view');
  const composeView = document.querySelector('#compose-view');
  const detailView = document.querySelector('#email-detail-view');

  if (!emailsView) return;

  // Show mailbox, hide others
  emailsView.style.display = 'block';
  if (composeView) composeView.style.display = 'none';
  if (detailView) detailView.style.display = 'none';

  // Title
  const title = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
  emailsView.innerHTML = `<h3>${title}</h3>`;

  // Fetch emails
  fetch(`/emails/${mailbox}`)
    .then(response => {
      if (!response.ok) throw new Error('Network response not ok');
      return response.json();
    })
    .then(emails => {
      // If no emails, show a message
      if (!emails || emails.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'email-empty';
        empty.style.margin = '10px 0';
        empty.textContent = 'No emails to show.';
        emailsView.appendChild(empty);
        return;
      }

      // Render each email
      emails.forEach(email => {
        const element = document.createElement('div');
        element.className = 'email-item';
        element.style.border = '1px solid #ccc';
        element.style.padding = '10px';
        element.style.margin = '5px 0';
        element.style.borderRadius = '5px';
        element.style.cursor = 'pointer';
        element.style.background = email.read ? '#f0f0f0' : '#fff';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'space-between';

        element.innerHTML = `
          <div>
            <strong>${email.sender}</strong>
            <span style="margin-left:10px;">${email.subject}</span>
          </div>
          <div style="color: #666;">${email.timestamp}</div>
        `;

        // Click to view detail
        element.addEventListener('click', () => {
          // Mark as read (best-effort)
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true })
          }).catch(console.error);

          // Show detail view
          emailsView.style.display = 'none';
          if (composeView) composeView.style.display = 'none';
          if (detailView) detailView.style.display = 'block';

          // Fetch full details
          fetch(`/emails/${email.id}`)
            .then(resp => {
              if (!resp.ok) throw new Error('Failed to fetch email detail');
              return resp.json();
            })
            .then(email_detail => {
              // Archive/unarchive button (available for any mailbox)
              let archiveButtonHtml = '';
              if (email_detail.archived) {
                archiveButtonHtml = `<button id="unarchive-btn" class="btn btn-sm btn-outline-secondary">Unarchive</button>`;
              } else {
                archiveButtonHtml = `<button id="archive-btn" class="btn btn-sm btn-outline-secondary">Archive</button>`;
              }

              const replyButtonHtml = `<button id="reply-btn" class="btn btn-sm btn-outline-primary" style="margin-left:8px;">Reply</button>`;

              detailView.innerHTML = `
                <div style="border:1px solid #ccc; padding:15px; border-radius:5px;">
                  <strong>From:</strong> ${email_detail.sender}<br>
                  <strong>To:</strong> ${(email_detail.recipients || []).join(', ')}<br>
                  <strong>Subject:</strong> ${email_detail.subject}<br>
                  <strong>Date:</strong> ${email_detail.timestamp}<br>
                  <hr>
                  <p style="white-space:pre-wrap;">${email_detail.body}</p>
                  ${archiveButtonHtml}
                  ${replyButtonHtml}
                </div>
              `;

              // Reply handler - replace node then attach to avoid duplicate listeners
              const replyBtn = document.querySelector('#reply-btn');
              if (replyBtn) {
                const newReply = replyBtn.cloneNode(true);
                replyBtn.parentNode.replaceChild(newReply, replyBtn);
                newReply.addEventListener('click', () => open_compose_prefill(email_detail));
              }

              // Archive/unarchive handler - replace node then attach
              const archBtn = document.querySelector('#archive-btn') || document.querySelector('#unarchive-btn');
              if (archBtn) {
                const newArch = archBtn.cloneNode(true);
                archBtn.parentNode.replaceChild(newArch, archBtn);
                newArch.addEventListener('click', () => {
                  fetch(`/emails/${email_detail.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ archived: !email_detail.archived })
                  })
                    .then(resp => {
                      if (!resp.ok) throw new Error('Failed to update archived status');
                      // reload the mailbox the user is currently viewing
                      load_mailbox(mailbox === 'archive' ? 'archive' : 'inbox');
                    })
                    .catch(err => {
                      console.error(err);
                      load_mailbox('inbox');
                    });
                });
              }
            })
            .catch(err => {
              console.error('Error fetching email detail:', err);
            });
        });

        emailsView.appendChild(element);
      });
    })
    .catch(error => {
      console.error('Error loading mailbox:', error);
      const msg = document.createElement('div');
      msg.style.color = 'red';
      msg.style.marginTop = '10px';
      msg.textContent = 'Unable to load mailbox.';
      emailsView.appendChild(msg);
    });
}