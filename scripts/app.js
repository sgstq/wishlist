// DOM Elements
const giftList = document.getElementById('giftList');
const giftBin = document.getElementById('giftBin');
const addGiftButton = document.getElementById('addGift');
const giftImageInput = document.getElementById('giftImage');
const giftPriceInput = document.getElementById('giftPrice');
const priceLimitInput = document.getElementById('priceLimit');
const totalPriceSpan = document.getElementById('totalPrice');
const previewModal = document.getElementById('previewModal');
const previewImage = document.getElementById('previewImage');
const closeButton = document.querySelector('.close-button');
const addToBinButton = document.getElementById('addToBin');
const showUploadButton = document.getElementById('showUploadSection');
const uploadOptions = document.querySelector('.upload-options');
const showLimitButton = document.getElementById('showLimitSection');
const limitSection = document.querySelector('.price-limit-section');
const setLimitButton = document.getElementById('setLimit');
const limitLeftSpan = document.getElementById('limitLeft');

// Initialize variables
let gifts = [];
let binGifts = [];
let priceLimit = 0;

// Event Listeners - Add these after DOM elements are defined
document.addEventListener('DOMContentLoaded', () => {
    // Upload section toggle
    showUploadButton?.addEventListener('click', () => {
        if (uploadOptions.style.display === 'none') {
            uploadOptions.style.display = 'block';
            showUploadButton.textContent = 'Hide Upload Options';
        } else {
            uploadOptions.style.display = 'none';
            showUploadButton.textContent = 'Add Gifts';
        }
    });

    // Price limit section toggle
    showLimitButton?.addEventListener('click', () => {
        if (limitSection.style.display === 'none') {
            limitSection.style.display = 'flex';
            showLimitButton.textContent = 'Hide Price Limit';
        } else {
            limitSection.style.display = 'none';
            showLimitButton.textContent = 'Set Price Limit';
        }
    });

    // Set price limit
    setLimitButton?.addEventListener('click', () => {
        const limitValue = priceLimitInput.value;
        if (!limitValue) {
            alert('Please enter a price limit');
            return;
        }
        priceLimit = Math.round(parseFloat(limitValue) * 100) || 0;
        updateBinStatus();
        
        limitSection.style.display = 'none';
        showLimitButton.textContent = 'Set Price Limit';
        priceLimitInput.value = '';
    });

    // Add gift(s)
    addGiftButton?.addEventListener('click', () => {
        const files = Array.from(giftImageInput.files);
        const price = giftPriceInput.value;

        if (files.length === 0) {
            alert('Please select at least one image');
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (price) {
                    const priceInCents = Math.round(parseFloat(price) * 100);
                    addGift(e.target.result, priceInCents);
                } else {
                    addGift(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        });

        giftImageInput.value = '';
        giftPriceInput.value = '';
        uploadOptions.style.display = 'none';
        showUploadButton.textContent = 'Add Gifts';
    });

    // Close modal
    closeButton?.addEventListener('click', () => {
        previewModal.style.display = 'none';
    });

    // Close modal when clicking outside
    previewModal?.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });
});

// Function to format cents to euros
function formatPrice(cents) {
    return `€${(cents / 100).toFixed(2)}`;
}

// Function to create a gift card element
function createGiftCard(gift) {
    const card = document.createElement('div');
    card.className = 'gift-card';
    card.draggable = true;
    card.dataset.id = gift.id;

    if (gift.price === null) {
        card.classList.add('no-price');
    }

    card.innerHTML = `
        <img src="${gift.image}" alt="Gift">
        <div class="price">${gift.price !== null ? formatPrice(gift.price) : 'Price not set'}</div>
        ${gift.price === null ? '<button class="set-price-button">Set Price</button>' : ''}
        <button class="remove-button">&times;</button>
    `;

    // Add click handler for image preview
    card.querySelector('img').addEventListener('click', () => showPreview(gift));

    // Add set price button handler
    const setPriceButton = card.querySelector('.set-price-button');
    if (setPriceButton) {
        setPriceButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showPreview(gift, true);
        });
    }

    // Add remove button handler
    card.querySelector('.remove-button').addEventListener('click', (e) => {
        e.stopPropagation();
        removeGift(gift.id);
    });

    // Add drag handlers
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

// Function to add a new gift
function addGift(image, price = null) {
    const gift = {
        id: Date.now(),
        image: image,
        price: price ? parseInt(price) : null,
        location: 'list'
    };
    gifts.push(gift);
    giftList.appendChild(createGiftCard(gift));
}

// Function to remove a gift
function removeGift(id) {
    const gift = gifts.find(g => g.id === id);
    if (!gift) return;
    
    if (gift.location === 'bin') {
        // If removing from bin, move back to list instead of deleting
        removeFromBin(id);
    } else {
        // If removing from list, delete completely
        gifts = gifts.filter(g => g.id !== id);
        const listCard = giftList.querySelector(`[data-id="${id}"]`);
        if (listCard) listCard.remove();
    }
}

// Function to show preview modal
function showPreview(gift, setPriceMode = false) {
    previewImage.src = gift.image;
    previewModal.style.display = 'block';
    
    if (setPriceMode || gift.price === null) {
        addToBinButton.textContent = 'Set Price';
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.step = '0.01';
        priceInput.placeholder = 'Enter price (€)';
        previewModal.querySelector('.modal-content').insertBefore(
            priceInput,
            addToBinButton
        );
        
        addToBinButton.onclick = () => {
            const price = priceInput.value;
            if (!price) {
                alert('Please enter a price');
                return;
            }
            gift.price = Math.round(parseFloat(price) * 100);
            const card = giftList.querySelector(`[data-id="${gift.id}"]`);
            if (card) {
                card.replaceWith(createGiftCard(gift));
            }
            previewModal.style.display = 'none';
        };
    } else {
        // Change button text and action based on gift location
        if (gift.location === 'bin') {
            addToBinButton.textContent = 'Remove from Bin';
            addToBinButton.onclick = () => {
                removeFromBin(gift.id);
                previewModal.style.display = 'none';
            };
        } else {
            addToBinButton.textContent = 'Add to Bin';
            addToBinButton.onclick = () => {
                addToBin(gift);
                previewModal.style.display = 'none';
            };
        }
    }
}

// Placeholder for drag and drop functions (will be implemented next)
function handleDragStart(e) {
    const card = e.target.closest('.gift-card'); // Make sure we get the card element
    if (!card) return;
    
    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    card.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

// Function to add gift to bin
function addToBin(gift) {
    if (binGifts.find(g => g.id === gift.id)) return; // Prevent duplicates
    
    // Remove from list display first
    const listCard = giftList.querySelector(`[data-id="${gift.id}"]`);
    if (listCard) {
        listCard.remove();
    }
    
    // Update gift location and add to binGifts
    gift.location = 'bin';
    binGifts.push(gift);
    
    // Add to bin display
    const card = createGiftCard(gift);
    giftBin.appendChild(card);
    updateBinStatus();
}

// Function to remove gift from bin
function removeFromBin(id) {
    const gift = gifts.find(g => g.id === id);
    if (!gift || gift.location !== 'bin') return;
    
    // Remove from bin display first
    const binCard = giftBin.querySelector(`[data-id="${id}"]`);
    if (binCard) {
        binCard.remove();
    }
    
    // Update gift location and remove from binGifts
    gift.location = 'list';
    binGifts = binGifts.filter(g => g.id !== id);
    
    // Add back to list display
    const card = createGiftCard(gift);
    giftList.appendChild(card);
    updateBinStatus();
}

// Function to calculate total price in bin
function calculateTotalPrice() {
    return binGifts.reduce((total, gift) => total + gift.price, 0);
}

// Function to update bin status
function updateBinStatus() {
    const totalPrice = calculateTotalPrice();
    totalPriceSpan.textContent = formatPrice(totalPrice);
    
    if (priceLimit === 0) {
        giftBin.classList.remove('under-limit', 'over-limit');
        limitLeftSpan.textContent = 'No limit set';
    } else {
        const limitLeft = priceLimit - totalPrice;
        limitLeftSpan.textContent = formatPrice(limitLeft);
        
        if (totalPrice > priceLimit) {
            giftBin.classList.remove('under-limit');
            giftBin.classList.add('over-limit');
            limitLeftSpan.style.color = '#ff0000';
        } else {
            giftBin.classList.remove('over-limit');
            giftBin.classList.add('under-limit');
            limitLeftSpan.style.color = '#008000';
        }
    }
}

// Setup drag and drop
giftBin.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    giftBin.classList.add('drag-over');
});

giftBin.addEventListener('dragleave', (e) => {
    // Only remove class if we're not dragging over a child element
    if (e.target === giftBin) {
        giftBin.classList.remove('drag-over');
    }
});

giftBin.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    giftBin.classList.remove('drag-over');
    
    try {
        const id = parseInt(e.dataTransfer.getData('text/plain'));
        if (isNaN(id)) return;
        
        const gift = gifts.find(g => g.id === id);
        if (gift && gift.location === 'list') {
            addToBin(gift);
        }
    } catch (error) {
        console.error('Drop error:', error);
    }
});

giftList.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    giftList.classList.add('drag-over');
});

giftList.addEventListener('dragleave', (e) => {
    // Only remove class if we're not dragging over a child element
    if (e.target === giftList) {
        giftList.classList.remove('drag-over');
    }
});

giftList.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    giftList.classList.remove('drag-over');
    
    try {
        const id = parseInt(e.dataTransfer.getData('text/plain'));
        if (isNaN(id)) return;
        
        const gift = gifts.find(g => g.id === id);
        if (gift && gift.location === 'bin') {
            removeFromBin(id);
        }
    } catch (error) {
        console.error('Drop error:', error);
    }
});