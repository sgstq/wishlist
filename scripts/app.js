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
            priceLimitInput.classList.add('error');
            return;
        }
        
        priceLimitInput.classList.remove('error');
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
            giftImageInput.classList.add('error');
            return;
        }
        
        giftImageInput.classList.remove('error');
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
        // Clean up any price input
        const existingInput = previewModal.querySelector('input[type="number"]');
        if (existingInput) {
            existingInput.remove();
        }
    });

    // Close modal when clicking outside
    previewModal?.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });

    // Upload form submit
    document.getElementById('uploadForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddGift();
    });

    // Price limit form submit
    document.getElementById('limitForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSetLimit();
    });

    // Move the existing button click handlers to separate functions
    function handleAddGift() {
        const files = Array.from(giftImageInput.files);
        const priceValue = giftPriceInput.value;
        const parsedPrice = priceValue ? validateAndParsePrice(priceValue) : null;

        if (files.length === 0) {
            giftImageInput.classList.add('error');
            return;
        }
        
        // If price is provided but invalid, show error
        if (priceValue && parsedPrice === null) {
            giftPriceInput.classList.add('error');
            return;
        }
        
        giftImageInput.classList.remove('error');
        giftPriceInput.classList.remove('error');
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                addGift(e.target.result, parsedPrice);
            };
            reader.readAsDataURL(file);
        });

        giftImageInput.value = '';
        giftPriceInput.value = '';
        uploadOptions.style.display = 'none';
        showUploadButton.textContent = 'Add Gifts';
    }

    function handleSetLimit() {
        const limitValue = priceLimitInput.value;
        const parsedLimit = validateAndParsePrice(limitValue);
        
        if (parsedLimit === null) {
            priceLimitInput.classList.add('error');
            return;
        }
        
        priceLimitInput.classList.remove('error');
        priceLimit = parsedLimit;
        updateBinStatus();
        
        limitSection.style.display = 'none';
        showLimitButton.textContent = 'Set Price Limit';
        priceLimitInput.value = '';
    }

    // Update existing button click handlers to use the new functions
    addGiftButton?.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submit since we're handling it
        handleAddGift();
    });

    setLimitButton?.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submit since we're handling it
        handleSetLimit();
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
    card.draggable = gift.price !== null;
    card.dataset.id = gift.id;

    if (gift.price === null) {
        card.classList.add('no-price');
    }

    card.innerHTML = `
        <img src="${gift.image}" alt="Gift">
        <div class="price" ${gift.price !== null ? 'data-editable="true"' : ''}>
            ${gift.price !== null ? formatPrice(gift.price) : 'Price not set'}
        </div>
        ${gift.price === null ? '<button class="set-price-button">Set Price</button>' : ''}
        <button class="remove-button"></button>
    `;

    // Add click handler for image preview
    card.querySelector('img').addEventListener('click', () => showPreview(gift));

    // Add price click handler for editing
    const priceDiv = card.querySelector('.price[data-editable="true"]');
    if (priceDiv) {
        priceDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            // Check if we're already editing
            if (card.querySelector('form')) return;
            
            const form = document.createElement('form');
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.min = '0';
            input.value = (gift.price / 100).toFixed(2);
            input.className = 'price-input';
            
            form.appendChild(input);
            priceDiv.style.display = 'none';
            priceDiv.after(form);
            input.focus();
            
            const updatePrice = () => {
                const parsedPrice = validateAndParsePrice(input.value);
                if (parsedPrice === null) {
                    input.classList.add('error');
                    return false;
                }
                gift.price = parsedPrice;
                priceDiv.textContent = formatPrice(gift.price);
                priceDiv.style.display = 'block';
                form.remove();
                updateBinStatus();
                return true;
            };
            
            form.onsubmit = (e) => {
                e.preventDefault();
                updatePrice();
            };
            
            input.onblur = () => {
                if (!updatePrice()) {
                    // If price update failed, restore original display
                    priceDiv.style.display = 'block';
                    form.remove();
                }
            };
        });
    }

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
    
    // Clean up any existing forms first
    const existingForms = previewModal.querySelectorAll('form');
    existingForms.forEach(form => form.remove());
    
    if (setPriceMode || gift.price === null) {
        addToBinButton.style.display = 'none';
        
        const priceForm = document.createElement('form');
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.step = '0.01';
        priceInput.min = '0';
        priceInput.placeholder = 'Enter price (€)';
        priceInput.className = 'price-input';
        
        priceForm.appendChild(priceInput);
        const modalContent = previewModal.querySelector('.modal-content');
        modalContent.insertBefore(priceForm, addToBinButton);
        
        priceInput.focus();
        
        priceForm.onsubmit = (e) => {
            e.preventDefault();
            const parsedPrice = validateAndParsePrice(priceInput.value);
            
            if (parsedPrice === null) {
                priceInput.classList.add('error');
                return;
            }
            
            priceInput.classList.remove('error');
            gift.price = parsedPrice;
            const card = giftList.querySelector(`[data-id="${gift.id}"]`);
            if (card) {
                card.replaceWith(createGiftCard(gift));
            }
            previewModal.style.display = 'none';
        };
    } else {
        // Show the Add to Bin button for normal preview
        addToBinButton.style.display = 'block';
        
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
    const card = e.target.closest('.gift-card');
    if (!card || !card.draggable) return;
    
    const giftId = parseInt(card.dataset.id);
    const gift = gifts.find(g => g.id === giftId);
    
    if (!gift || gift.price === null) {
        e.preventDefault();
        return;
    }
    
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
        const emoji = limitLeft >= 0 ? ' 😊' : ' 😢';
        limitLeftSpan.textContent = formatPrice(limitLeft) + emoji;
        
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

// Add this helper function near the top with other utility functions
function validateAndParsePrice(value) {
    // Remove any whitespace
    const trimmed = String(value).trim();
    if (trimmed === '') return null;
    
    // Parse the value
    const parsed = parseFloat(trimmed);
    
    // Check if it's a valid non-negative number
    if (isNaN(parsed) || parsed < 0) return null;
    
    // Convert to cents and round to avoid floating point issues
    return Math.round(parsed * 100);
}

// Function to export gifts
function exportGifts(gifts) {
    const dataStr = JSON.stringify(gifts, null, 2); // Convert gifts to JSON
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gifts.json'; // Name of the exported file
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to import gifts
function importGifts(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedGifts = JSON.parse(e.target.result);
            
            // Clear existing gifts
            gifts = [];
            binGifts = [];
            giftList.innerHTML = '';
            giftBin.innerHTML = '';
            
            // Add each imported gift to the appropriate location
            importedGifts.forEach(gift => {
                gifts.push(gift);
                if (gift.location === 'bin') {
                    binGifts.push(gift);
                    giftBin.appendChild(createGiftCard(gift));
                } else {
                    giftList.appendChild(createGiftCard(gift));
                }
            });
            
            // Update the bin status
            updateBinStatus();
        } catch (error) {
            console.error('Error importing gifts:', error);
            alert('Error importing gifts. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

// Function to get all gifts
function getGifts() {
    // Return a copy of the gifts array to avoid modifying the original
    return [...gifts];
}

// Update the export click handler to include both list and bin gifts
document.getElementById('exportGifts').addEventListener('click', () => {
    // Get all gifts with their current locations
    const giftsToExport = getGifts();
    exportGifts(giftsToExport);
});

document.getElementById('importGifts').addEventListener('change', importGifts);