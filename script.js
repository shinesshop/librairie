// --- CONFIGURATION OBLIGATOIRE ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyfkA_JxdfsGy3-hVIiYvhwI4Ub77UTtXhbZtT3fbgiaYasdrKwQ9N6RjqnllIJ4hNLxA/exec'; // <-- REMPLACEZ CECI
// ---------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const itemsContainer = document.getElementById('items-container');
    const orderForm = document.getElementById('order-form');
    const submitButton = document.getElementById('submit-button');
    const statusMessage = document.getElementById('status-message');

    async function fetchInventory() {
        try {
            const response = await fetch(WEB_APP_URL);
            if (!response.ok) throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();
            if (data.success && data.items) renderItems(data.items);
            else showError('Impossible de charger l\'inventaire. Réponse invalide du serveur.');
        } catch (error) {
            showError(`Erreur de connexion : ${error.message}`);
        }
    }

    function renderItems(items) {
        itemsContainer.innerHTML = '';
        if (items.length === 0) {
            itemsContainer.innerHTML = '<p>Aucun article disponible pour le moment.</p>';
            return;
        }
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');
            itemDiv.innerHTML = `<div class="item-details"><div class="item-name">${item.name}</div><div class="item-price">${item.price} FCFA</div></div><div class="item-quantity"><input type="number" min="0" placeholder="0" data-sku="${item.sku}" data-name="${item.name}" aria-label="Quantité pour ${item.name}"></div>`;
            itemsContainer.appendChild(itemDiv);
        });
    }

    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';
        clearStatus();

        const order = {
            client: {
                name: document.getElementById('client-name').value.trim(),
                email: document.getElementById('client-email').value.trim(),
                phone: document.getElementById('client-phone').value.trim(),
            },
            items: []
        };
        document.querySelectorAll('.item-quantity input').forEach(input => {
            const quantity = parseInt(input.value) || 0;
            if (quantity > 0) order.items.push({ sku: input.dataset.sku, name: input.dataset.name, quantity: quantity });
        });
        
        if (order.items.length === 0) {
            showStatus('Veuillez sélectionner au moins un article.', 'error');
            enableSubmitButton();
            return;
        }

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify(order),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            const result = await response.json();
            
            if (result.success) {
                showStatus(`Commande enregistrée ! Total : ${result.total} FCFA.`, 'success');
                orderForm.reset();
                fetchInventory();
            } else {
                showStatus(`Erreur : ${result.message}`, 'error');
            }
        } catch (error) {
            showStatus(`Erreur réseau : ${error.message}`, 'error');
        } finally {
            enableSubmitButton();
        }
    });
    
    function showStatus(message, type) { statusMessage.textContent = message; statusMessage.className = type; }
    function showError(message) { itemsContainer.innerHTML = `<div id="status-message" class="error">${message}</div>`; }
    function clearStatus() { statusMessage.textContent = ''; statusMessage.className = ''; }
    function enableSubmitButton() { submitButton.disabled = false; submitButton.textContent = 'Envoyer la Commande'; }

    fetchInventory();
});
