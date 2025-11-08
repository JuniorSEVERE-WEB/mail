document.addEventListener('DOMContentLoaded', () => {
    const inboxBtn = document.querySelector('#inbox');
    const sentBtn = document.querySelector('#sent');
    const archivedBtn = document.querySelector('#archived');
    const composeBtn = document.querySelector('#compose');

    if (inboxBtn) inboxBtn.addEventListener('click', () => load_mailbox('inbox'));
    if (sentBtn) sentBtn.addEventListener('click', () => load_mailbox('sent'));
    if (archivedBtn) archivedBtn.addEventListener('click', () => load_mailbox('archive'));
    if (composeBtn) composeBtn.addEventListener('click', compose_email);

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
        if (r) r.value = '';
        if (s) s.value = '';
        if (b) b.value = '';
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

                element.innerHTML = `
                    <strong>From: ${email.sender}</strong>
                    <span style="margin-left:10px;">${email.subject}</span>
                    <span style="float:right;">${email.timestamp}</span>
                `;

                // Click to view detail
                element.addEventListener('click', () => {
                    // Mark read
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
                            // Archive/unarchive button
                            let archiveButtonHtml = '';
                            if (mailbox !== 'sent') {
                                if (email_detail.archived) {
                                    archiveButtonHtml = `<button id="unarchive-btn" class="btn btn-sm btn-outline-secondary">Unarchive</button>`;
                                } else {
                                    archiveButtonHtml = `<button id="archive-btn" class="btn btn-sm btn-outline-secondary">Archive</button>`;
                                }
                            }

                            const replyButtonHtml = `<button id="reply-btn" class="btn btn-sm btn-outline-primary" style="margin-left:8px;">Reply</button>`;

                            detailView.innerHTML = `
                                <div style="border:1px solid #ccc; padding:15px; border-radius:5px;">
                                  <strong>From:</strong> ${email_detail.sender}<br>
                                  <strong>To:</strong> ${email_detail.recipients.join(', ')}<br>
                                  <strong>Subject:</strong> ${email_detail.subject}<br>
                                  <strong>Date:</strong> ${email_detail.timestamp}<br>
                                  <hr>
                                  <p style="white-space:pre-wrap;">${email_detail.body}</p>
                                  ${archiveButtonHtml}
                                  ${replyButtonHtml}
                                </div>
                            `;

                            // Reply handler
                            const replyBtn = document.querySelector('#reply-btn');
                            if (replyBtn) {
                                replyBtn.addEventListener('click', () => {
                                    emailsView.style.display = 'none';
                                    if (composeView) composeView.style.display = 'block';
                                    detailView.style.display = 'none';

                                    const r = document.querySelector('#compose-recipients');
                                    const s = document.querySelector('#compose-subject');
                                    const b = document.querySelector('#compose-body');
                                    if (r) r.value = email_detail.sender;
                                    const subject = email_detail.subject.startsWith('Re:') ? email_detail.subject : `Re: ${email_detail.subject}`;
                                    if (s) s.value = subject;
                                    if (b) b.value = `\n\nOn ${email_detail.timestamp}, ${email_detail.sender} wrote:\n${email_detail.body}`;
                                });
                            }

                            // Archive/unarchive handler
                            if (mailbox !== 'sent') {
                                const archBtn = document.querySelector('#archive-btn') || document.querySelector('#unarchive-btn');
                                if (archBtn) {
                                    archBtn.addEventListener('click', () => {
                                        fetch(`/emails/${email_detail.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ archived: !email_detail.archived })
                                        })
                                            .then(resp => {
                                                if (!resp.ok) throw new Error('Failed to update archived status');
                                                // reload the mailbox user is currently viewing
                                                load_mailbox(mailbox === 'archive' ? 'archive' : 'inbox');
                                            })
                                            .catch(err => {
                                                console.error(err);
                                                load_mailbox('inbox');
                                            });
                                    });
                                }
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
        if (r) r.value = '';
        if (s) s.value = '';
        if (b) b.value = '';
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

                element.innerHTML = `
                    <strong>From: ${email.sender}</strong>
                    <span style="margin-left:10px;">${email.subject}</span>
                    <span style="float:right;">${email.timestamp}</span>
                `;

                // Click to view detail
                element.addEventListener('click', () => {
                    // Mark read
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
                            // Archive/unarchive button
                            let archiveButtonHtml = '';
                            if (mailbox !== 'sent') {
                                if (email_detail.archived) {
                                    archiveButtonHtml = `<button id="unarchive-btn" class="btn btn-sm btn-outline-secondary">Unarchive</button>`;
                                } else {
                                    archiveButtonHtml = `<button id="archive-btn" class="btn btn-sm btn-outline-secondary">Archive</button>`;
                                }
                            }

                            const replyButtonHtml = `<button id="reply-btn" class="btn btn-sm btn-outline-primary" style="margin-left:8px;">Reply</button>`;

                            detailView.innerHTML = `
                                <div style="border:1px solid #ccc; padding:15px; border-radius:5px;">
                                  <strong>From:</strong> ${email_detail.sender}<br>
                                  <strong>To:</strong> ${email_detail.recipients.join(', ')}<br>
                                  <strong>Subject:</strong> ${email_detail.subject}<br>
                                  <strong>Date:</strong> ${email_detail.timestamp}<br>
                                  <hr>
                                  <p style="white-space:pre-wrap;">${email_detail.body}</p>
                                  ${archiveButtonHtml}
                                  ${replyButtonHtml}
                                </div>
                            `;

                            // Reply handler
                            const replyBtn = document.querySelector('#reply-btn');
                            if (replyBtn) {
                                replyBtn.addEventListener('click', () => {
                                    emailsView.style.display = 'none';
                                    if (composeView) composeView.style.display = 'block';
                                    detailView.style.display = 'none';

                                    const r = document.querySelector('#compose-recipients');
                                    const s = document.querySelector('#compose-subject');
                                    const b = document.querySelector('#compose-body');
                                    if (r) r.value = email_detail.sender;
                                    const subject = email_detail.subject.startsWith('Re:') ? email_detail.subject : `Re: ${email_detail.subject}`;
                                    if (s) s.value = subject;
                                    if (b) b.value = `\n\nOn ${email_detail.timestamp}, ${email_detail.sender} wrote:\n${email_detail.body}`;
                                });
                            }

                            // Archive/unarchive handler
                            if (mailbox !== 'sent') {
                                const archBtn = document.querySelector('#archive-btn') || document.querySelector('#unarchive-btn');
                                if (archBtn) {
                                    archBtn.addEventListener('click', () => {
                                        fetch(`/emails/${email_detail.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ archived: !email_detail.archived })
                                        })
                                            .then(resp => {
                                                if (!resp.ok) throw new Error('Failed to update archived status');
                                                // reload the mailbox user is currently viewing
                                                load_mailbox(mailbox === 'archive' ? 'archive' : 'inbox');
                                            })
                                            .catch(err => {
                                                console.error(err);
                                                load_mailbox('inbox');
                                            });
                                    });
                                }
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