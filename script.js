const API_URL = 'https://script.google.com/macros/s/AKfycbwCiyhZ3CkT7Nkh6dymwyiCIzryVV8sPgKVKVWwDSB9cgM_-zkJpTBjC1tOVcRCoNTLwA/exec';

        let currentGiftId = null;
        let myModal = null;

        document.addEventListener("DOMContentLoaded", () => {
            myModal = new bootstrap.Modal(document.getElementById('reserveModal'));
            loadGifts();
        });

        function showPage(pageId) {
            document.getElementById('gifts-page').style.display = pageId === 'gifts-page' ? 'block' : 'none';
            document.getElementById('rsvp-page').style.display = pageId === 'rsvp-page' ? 'block' : 'none';
            document.getElementById('admin-page').style.display = pageId === 'admin-page' ? 'block' : 'none';
            
            document.getElementById('view-gifts-btn').classList.toggle('active', pageId === 'gifts-page');
            document.getElementById('view-rsvp-btn').classList.toggle('active', pageId === 'rsvp-page');
            document.getElementById('view-admin-btn').classList.toggle('active', pageId === 'admin-page');
        }

        function checkAdminPass() {
            if(document.getElementById('admin-pass').value === 'nay2026') {
                document.getElementById('admin-auth').style.display = 'none';
                document.getElementById('admin-form').style.display = 'block';
            } else {
                alert('Senha incorreta!');
            }
        }

        // CORREÇÃO LOGÍSTICA: Carregamento via injeção de script tag (ignora o erro de CORS do navegador)
        function loadGifts() {
            const oldScript = document.getElementById('jsonp-script');
            if (oldScript) oldScript.remove();

            const script = document.createElement('script');
            script.id = 'jsonp-script';
            script.src = `${API_URL}?callback=handleGiftsResponse&nocache=${new Date().getTime()}`;
            document.body.appendChild(script);
        }

        // Executado automaticamente assim que o Google Sheets devolve a resposta estruturada
        function handleGiftsResponse(gifts) {
            const container = document.getElementById('gifts-container');
            container.innerHTML = '';

            if(!gifts || gifts.length === 0) {
                container.innerHTML = '<p class="text-center w-100 text-muted">Nenhum item cadastrado ainda.</p>';
                return;
            }

            gifts.forEach(gift => {
                const isReserved = gift.reservadoPor && gift.reservadoPor.toString().trim() !== "";
                const card = document.createElement('div');
                card.className = 'col';
                card.innerHTML = `
                    <div class="card h-100 crystal-card" id="card-${gift.id}">
                        <img src="${gift.imagem || 'https://via.placeholder.com/300x200/111111/ffffff?text=Preto+e+Cristal'}" class="card-img-top gift-img" alt="${gift.item}">
                        <div class="card-body d-flex flex-column justify-content-between">
                            <h5 class="card-title text-center text-white mb-3">${gift.item}</h5>
                            <div id="actions-${gift.id}">
                                <a href="${gift.link}" target="_blank" class="btn btn-outline-secondary btn-sm w-100 mb-2" style="color: #ccc">Ver Onde Comprar ↗</a>
                                ${isReserved ? 
                                    `<button class="btn btn-reserved w-100" disabled>Reservado por ${gift.reservadoPor}</button>` : 
                                    `<button class="btn btn-crystal w-100 btn-action" onclick="openReserveModal('${gift.id}', '${gift.item}')">Reservar Presente</button>`
                                }
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function openReserveModal(id, name) {
            currentGiftId = id;
            document.getElementById('modal-item-name').innerText = name;
            document.getElementById('guest-name').value = '';
            myModal.show();
        }

        async function confirmReservation() {
            const name = document.getElementById('guest-name').value.trim();
            if(!name) {
                alert('Por favor, insira seu nome!');
                return;
            }

            myModal.hide();
            
            const actionContainer = document.getElementById(`actions-${currentGiftId}`);
            if (actionContainer) {
                const buyLink = actionContainer.querySelector('a').outerHTML;
                actionContainer.innerHTML = `${buyLink} <button class="btn btn-reserved w-100" disabled>Reservando para você...</button>`;
            }

            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reserve', id: currentGiftId, nome: name })
            });

            setTimeout(() => { loadGifts(); }, 3000);
        }

        async function submitRSVP() {
            const nome = document.getElementById('rsvp-name').value.trim();
            const tipo = document.getElementById('rsvp-type').value;

            if(!nome) {
                alert('Por favor, preencha seu nome completo.');
                return;
            }

            document.getElementById('rsvp-form').style.display = 'none';
            document.getElementById('rsvp-success').style.display = 'block';
            document.getElementById('rsvp-success').innerHTML = '<div class="spinner-border text-light"></div><p class="mt-2">Confirmando...</p>';

            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'rsvp', nome: nome, tipo: tipo })
            });

            setTimeout(() => {
                document.getElementById('rsvp-success').innerHTML = `
                    <h4 style="color: #fff; text-shadow: 0 0 10px var(--crystal-glow)">✓ Presença Confirmada!</h4>
                    <p class="text-muted mt-2">Obrigado por confirmar, ${nome}. Nos vemos no Chá!</p>
                `;
            }, 1500);
        }

        async function addGiftItem() {
            const item = document.getElementById('item-name').value.trim();
            const link = document.getElementById('item-link').value.trim();
            const imagem = document.getElementById('item-img').value.trim();

            if(!item || !link || !imagem) {
                alert('Preencha todos os campos!');
                return;
            }

            alert('Adicionando item...');
            
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', item, link, imagem })
            });

            document.getElementById('item-name').value = '';
            document.getElementById('item-link').value = '';
            document.getElementById('item-img').value = '';
            
            setTimeout(() => { showPage('gifts-page'); loadGifts(); }, 2500);
        }
    