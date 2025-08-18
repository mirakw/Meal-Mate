// Global variables
let recipes = [];
let folders = [];
let selectedRecipes = [];
let startDate = null;
let endDate = null;
let groceryListState = {};
let currentFolder = null;
let currentGroceryListData = null; // Store current grocery list for saving

// Modal Functions for New Design
function showExtractModal() {
    loadFolderSelects();
    const modal = new bootstrap.Modal(document.getElementById('extractModal'));
    modal.show();
}

function showManualModal() {
    loadFolderSelects();
    const modal = new bootstrap.Modal(document.getElementById('manualModal'));
    modal.show();
}

function showMealPlanModal() {
    loadRecipeSelection();
    initializeDateInputs();
    
    // Add event listeners for date inputs
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    
    startInput.addEventListener('change', updateDateRange);
    endInput.addEventListener('change', updateDateRange);
    
    const modal = new bootstrap.Modal(document.getElementById('mealPlanModal'));
    modal.show();
}

function showCreateFolderModal() {
    const modal = new bootstrap.Modal(document.getElementById('createFolderModal'));
    modal.show();
}

function showRenameFolderModal() {
    loadFolderSelects();
    // Clear the new folder name field
    document.getElementById('newFolderName').value = '';
    
    // Add event listener to populate current name when folder is selected
    const selectRenameFolder = document.getElementById('selectRenameFolder');
    selectRenameFolder.onchange = function() {
        const selectedFolderId = this.value;
        if (selectedFolderId) {
            const selectedFolder = folders.find(f => f.id === selectedFolderId);
            if (selectedFolder) {
                document.getElementById('newFolderName').value = selectedFolder.name;
            }
        } else {
            document.getElementById('newFolderName').value = '';
        }
    };
    
    const modal = new bootstrap.Modal(document.getElementById('renameFolderModal'));
    modal.show();
}

function showDeleteFolderModal() {
    loadFolderSelects();
    const modal = new bootstrap.Modal(document.getElementById('deleteFolderModal'));
    modal.show();
}

// Global modal cleanup function
function cleanupAllModals() {
    // Remove all modal backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Reset body state
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Hide all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.dispose();
        }
        modal.style.display = 'none';
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
        modal.removeAttribute('role');
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadFolders();
    loadRecipes();
    setupEventListeners();
    initializeDateInputs();
});

function setupEventListeners() {
    // Add smooth scrolling and enhanced interactions
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('hover-lift')) {
            e.target.style.transform = 'translateY(-4px)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 200);
        }
    });

    // Tab change events
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            if (e.target.id === 'planner-tab') {
                loadRecipeSelection();
            } else if (e.target.id === 'extract-tab') {
                loadFolderSelects();
            }
        });
    });
}

// Date handling functions
function initializeDateInputs() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    document.getElementById('startDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('endDate').value = weekFromNow.toISOString().split('T')[0];
    
    updateDateRange();
}

function updateDateRange() {
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    
    if (!startInput || !endInput) return;
    
    startDate = startInput.value;
    endDate = endInput.value;
    
    // Optional: Update info element if it exists
    const infoElement = document.getElementById('dateRangeInfo');
    if (infoElement && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (start > end) {
            infoElement.innerHTML = '<span class="text-danger"><i class="fas fa-exclamation-triangle me-1"></i>End date must be after start date</span>';
            return;
        }
        
        infoElement.innerHTML = `<span class="text-info"><i class="fas fa-calendar-check me-1"></i>Planning meals for ${diffDays} days (${start.toLocaleDateString()} - ${end.toLocaleDateString()})</span>`;
        infoElement.className = 'mt-2 date-range-info';
    }
    
    updateSelectedRecipes();
}

// Folder management functions
async function loadFolders() {
    try {
        const response = await fetch('/api/folders', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        
        folders = data;
        displayFolders(data);
    } catch (error) {
        showAlert('Error loading folders: ' + error.message, 'danger');
    }
}

function displayFolders(folderList) {
    const folderGrid = document.getElementById('folderGrid');
    if (!folderGrid) return;
    
    if (folderList.length === 0) {
        folderGrid.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-folder-open fa-4x text-secondary mb-3"></i>
                <h4 class="text-secondary">No folders yet</h4>
                <p class="text-muted">Create your first folder to organize your recipes!</p>
                <button class="btn btn-primary" onclick="showCreateFolderModal()">
                    <i class="fas fa-plus me-2"></i>Create First Folder
                </button>
            </div>
        `;
        return;
    }
    
    folderGrid.innerHTML = folderList.map(folder => `
        <div class="folder-card slide-up" onclick="showFolderRecipes('${folder.id}', '${folder.name}')">
            <div class="folder-icon">
                <i class="fas fa-folder"></i>
            </div>
            <div class="folder-name">${folder.name}</div>
            <div class="folder-count">${folder.recipe_count} recipe${folder.recipe_count !== 1 ? 's' : ''}</div>
        </div>
    `).join('');
}

async function showFolderRecipes(folderId, folderName) {
    try {
        currentFolder = { id: folderId, name: folderName };
        
        showLoading('Loading recipes...', 'Fetching recipes from ' + folderName);
        const response = await fetch(`/api/folders/${folderId}/recipes`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const recipes = await response.json();
        console.log('Fetched recipes:', recipes);
        
        // Complete modal cleanup
        cleanupAllModals();
        
        // Small delay then show folder modal
        setTimeout(() => {
            displayFolderModal(folderName, recipes);
        }, 300);
        
    } catch (error) {
        console.error('Error in showFolderRecipes:', error);
        cleanupAllModals();
        showAlert('Error loading folder recipes: ' + error.message, 'danger');
    }
}

function displayFolderModal(folderName, recipes) {
    console.log('displayFolderModal called with:', folderName, recipes);
    
    const modalTitle = document.getElementById('folderModalTitle');
    const modalBody = document.getElementById('folderModalBody');
    const folderModal = document.getElementById('folderModal');
    
    if (!modalTitle || !modalBody || !folderModal) {
        console.error('Modal elements not found:', { modalTitle, modalBody, folderModal });
        showAlert('Error: Modal elements not found', 'danger');
        return;
    }
    
    modalTitle.textContent = folderName;
    
    if (recipes.length === 0) {
        modalBody.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-utensils" style="font-size: 3rem; color: #6c757d;"></i>
                <h5 class="mt-3">No Recipes in This Folder</h5>
                <p class="text-muted">Add recipes to this folder using the "Add Recipe" tab.</p>
            </div>
        `;
    } else {
        const recipeList = recipes.map(recipe => `
            <div class="card mb-2 recipe-card" onclick="showRecipeDetails('${recipe.folder_id}', '${recipe.name}')">
                <div class="card-body">
                    <h6 class="card-title mb-1">${recipe.name}</h6>
                    <div class="recipe-meta">
                        ${recipe.serving_size ? `<span class="me-3"><i class="fas fa-users me-1"></i>${recipe.serving_size}</span>` : ''}
                        <span class="me-3"><i class="fas fa-list me-1"></i>${recipe.ingredients_count} ingredients</span>
                        <span><i class="fas fa-tasks me-1"></i>${recipe.instructions_count} steps</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        modalBody.innerHTML = recipeList;
    }
    
    // Set up folder action buttons
    const renameBtn = document.getElementById('renameFolderBtn');
    const deleteBtn = document.getElementById('deleteFolderBtn');
    
    if (renameBtn) renameBtn.onclick = () => showRenameFolderModal();
    if (deleteBtn) deleteBtn.onclick = () => deleteFolderConfirm();
    
    console.log('About to show modal...');
    try {
        const modal = new bootstrap.Modal(folderModal);
        modal.show();
        console.log('Modal show() called successfully');
    } catch (error) {
        console.error('Error showing modal:', error);
        showAlert('Error displaying folder modal', 'danger');
    }
}

// Recipe loading and display functions
async function loadRecipes() {
    try {
        const response = await fetch('/api/recipes', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        
        recipes = data;
        displayRecipes(data);
    } catch (error) {
        showAlert('Error loading recipes: ' + error.message, 'danger');
    }
}

function displayRecipes(recipeList) {
    const recipeGrid = document.getElementById('recipeGrid');
    if (!recipeGrid) return;
    
    if (recipeList.length === 0) {
        recipeGrid.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-utensils fa-4x text-secondary mb-3"></i>
                <h4 class="text-secondary">No recipes yet</h4>
                <p class="text-muted">Start building your recipe collection!</p>
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-primary" onclick="showExtractModal()">
                        <i class="fas fa-link me-2"></i>Add from URL
                    </button>
                    <button class="btn btn-success" onclick="showManualModal()">
                        <i class="fas fa-edit me-2"></i>Create Recipe
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    recipeGrid.innerHTML = recipeList.map(recipe => `
        <div class="recipe-card slide-up" onclick="showRecipeDetails('${recipe.folder_id}', '${recipe.name}')">
            <div class="recipe-card-header">
                <h5 class="recipe-card-title">${recipe.name}</h5>
            </div>
            <div class="recipe-card-body">
                <p class="text-secondary mb-2">
                    <i class="fas fa-folder me-1"></i>${recipe.folder_name || 'Uncategorized'}
                </p>
                <p class="text-secondary mb-2">
                    <i class="fas fa-users me-1"></i>${recipe.serving_size || 'No serving info'}
                </p>
                <div class="recipe-card-actions">
                    <button class="btn btn-outline-primary btn-sm" onclick="event.stopPropagation(); showRecipeDetails('${recipe.folder_id}', '${recipe.name}')">
                        <i class="fas fa-eye me-1"></i>View
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="event.stopPropagation(); deleteRecipe('${recipe.name}', '${recipe.folder_id}')">
                        <i class="fas fa-trash me-1"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function showRecipeDetails(folderId, recipeName) {
    try {
        showLoading('Loading recipe details...', 'Fetching recipe information.');
        const response = await fetch(`/api/recipe/${encodeURIComponent(folderId)}/${encodeURIComponent(recipeName)}`, {
            credentials: 'same-origin'
        });
        const recipe = await response.json();
        
        if (response.ok) {
            cleanupAllModals();
            setTimeout(() => {
                displayRecipeModal(recipe, folderId);
            }, 100);
        } else {
            cleanupAllModals();
            throw new Error(recipe.error || 'Recipe not found');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error loading recipe details: ' + error.message, 'danger');
    }
}

function displayRecipeModal(recipe, folderId) {
    document.getElementById('recipeModalTitle').textContent = recipe.name;
    
    const ingredientsList = recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('');
    const instructionsList = recipe.instructions.map((instruction, index) => 
        `<li><strong>Step ${index + 1}:</strong> ${instruction}</li>`).join('');
    
    document.getElementById('recipeModalBody').innerHTML = `
        ${recipe.serving_size ? `<p><strong>Serving Size:</strong> ${recipe.serving_size}</p>` : ''}
        
        <h6><i class="fas fa-list me-2"></i>Ingredients (${recipe.ingredients.length})</h6>
        <ul class="mb-4">${ingredientsList}</ul>
        
        <h6><i class="fas fa-tasks me-2"></i>Instructions (${recipe.instructions.length})</h6>
        <ol>${instructionsList}</ol>
    `;
    
    // Set up move button
    document.getElementById('moveRecipeBtn').onclick = () => showMoveRecipeModal(recipe.name, folderId);
    
    // Set up delete button
    document.getElementById('deleteRecipeBtn').onclick = () => deleteRecipe(recipe.name, folderId);
    
    new bootstrap.Modal(document.getElementById('recipeModal')).show();
}

// Global variables to store current recipe move context
let currentMoveRecipe = null;
let currentMoveFolder = null;

function showMoveRecipeModal(recipeName, currentFolderId) {
    currentMoveRecipe = recipeName;
    currentMoveFolder = currentFolderId;
    
    // Set recipe name in modal
    document.getElementById('moveRecipeName').textContent = recipeName;
    
    // Populate folder dropdown (exclude current folder)
    const moveTargetFolder = document.getElementById('moveTargetFolder');
    const defaultOption = '<option value="">Choose folder...</option>';
    const options = folders
        .filter(folder => folder.id !== currentFolderId) // Exclude current folder
        .map(folder => `<option value="${folder.id}">${folder.name}</option>`)
        .join('');
    
    moveTargetFolder.innerHTML = defaultOption + options;
    
    // Close recipe modal and show move modal
    const recipeModal = bootstrap.Modal.getInstance(document.getElementById('recipeModal'));
    if (recipeModal) {
        recipeModal.hide();
    }
    
    new bootstrap.Modal(document.getElementById('moveRecipeModal')).show();
}

async function confirmMoveRecipe() {
    const targetFolder = document.getElementById('moveTargetFolder').value;
    
    if (!targetFolder) {
        showAlert('Please select a target folder', 'warning');
        return;
    }
    
    if (!currentMoveRecipe || !currentMoveFolder) {
        showAlert('Recipe information missing', 'danger');
        return;
    }
    
    try {
        showLoading('Moving recipe...', 'Please wait while we move your recipe');
        
        const response = await fetch('/api/move-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                recipe_name: currentMoveRecipe,
                current_folder: currentMoveFolder,
                target_folder: targetFolder
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (response.ok) {
            cleanupAllModals();
            showAlert(result.message, 'success');
            loadFolders(); // Refresh folder counts
            loadRecipes(); // Refresh recipe list
            
            // Reset move context
            currentMoveRecipe = null;
            currentMoveFolder = null;
        } else {
            throw new Error(result.error || 'Failed to move recipe');
        }
    } catch (error) {
        hideLoading();
        showAlert('Error moving recipe: ' + error.message, 'danger');
    }
}

async function deleteRecipe(recipeName, folderId) {
    if (!confirm(`Are you sure you want to delete "${recipeName}"?`)) {
        return;
    }
    
    try {
        showLoading('Deleting recipe...', 'Please wait while we remove the recipe.');
        const response = await fetch(`/api/delete-recipe/${encodeURIComponent(folderId)}/${encodeURIComponent(recipeName)}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        const result = await response.json();
        
        if (response.ok) {
            cleanupAllModals();
            showAlert(result.message, 'success');
            loadRecipes();
            loadFolders(); // Also reload folders to update recipe counts
        } else {
            cleanupAllModals();
            throw new Error(result.error || 'Failed to delete recipe');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error deleting recipe: ' + error.message, 'danger');
    }
}

// Folder management actions
function showCreateFolderModal() {
    document.getElementById('folderName').value = '';
    new bootstrap.Modal(document.getElementById('createFolderModal')).show();
}

async function createFolder() {
    const name = document.getElementById('folderName').value.trim();
    
    if (!name) {
        showAlert('Please enter a folder name', 'warning');
        return;
    }
    
    try {
        showLoading('Creating folder...', 'Please wait while we create your new folder.');
        const response = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ name: name })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('createFolderModal')).hide();
            cleanupAllModals();
            showAlert('Folder created successfully!', 'success');
            loadFolders();
            loadFolderSelects();
        } else {
            cleanupAllModals();
            throw new Error(result.error || 'Failed to create folder');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error creating folder: ' + error.message, 'danger');
    }
}



async function renameFolder() {
    const folderId = document.getElementById('selectRenameFolder').value;
    const newName = document.getElementById('newFolderName').value.trim();
    
    if (!folderId) {
        showAlert('Please select a folder to rename', 'warning');
        return;
    }
    
    if (!newName) {
        showAlert('Please enter a new folder name', 'warning');
        return;
    }
    
    try {
        showLoading('Renaming folder...', 'Please wait while we update the folder name.');
        const response = await fetch(`/api/folders/${folderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ name: newName })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            cleanupAllModals();
            showAlert('Folder renamed successfully!', 'success');
            loadFolders();
            loadFolderSelects();
        } else {
            cleanupAllModals();
            throw new Error(result.error || 'Failed to rename folder');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error renaming folder: ' + error.message, 'danger');
    }
}

function deleteFolderConfirm() {
    showDeleteFolderModal();
}

async function confirmDeleteFolder() {
    const folderId = document.getElementById('selectDeleteFolder').value;
    
    if (!folderId) {
        showAlert('Please select a folder to delete', 'warning');
        return;
    }
    
    const folderName = folders.find(f => f.id === folderId)?.name || 'Unknown';
    
    if (!confirm(`Are you sure you want to delete the folder "${folderName}"? All recipes will be moved to "Uncategorized".`)) {
        return;
    }
    
    try {
        showLoading('Deleting folder...', 'Moving recipes to Uncategorized folder...');
        const response = await fetch(`/api/folders/${folderId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            cleanupAllModals();
            showAlert('Folder deleted successfully!', 'success');
            loadFolders();
            loadFolderSelects();
        } else {
            cleanupAllModals();
            throw new Error(result.error || 'Failed to delete folder');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error deleting folder: ' + error.message, 'danger');
    }
}

function loadFolderSelects() {
    const extractFolder = document.getElementById('extractFolder');
    const manualFolder = document.getElementById('manualFolder');
    const selectRenameFolder = document.getElementById('selectRenameFolder');
    const selectDeleteFolder = document.getElementById('selectDeleteFolder');
    
    const defaultOption = '<option value="">Select a folder...</option>';
    const options = folders.map(folder => 
        `<option value="${folder.id}">${folder.name}</option>`
    ).join('');
    
    // Filter out uncategorized for delete and rename operations
    const deletableOptions = folders
        .filter(folder => folder.id !== 'uncategorized')
        .map(folder => `<option value="${folder.id}">${folder.name}</option>`)
        .join('');
    
    if (extractFolder) {
        extractFolder.innerHTML = defaultOption + options;
    }
    if (manualFolder) {
        manualFolder.innerHTML = defaultOption + options;
    }
    if (selectRenameFolder) {
        selectRenameFolder.innerHTML = '<option value="">Choose folder to rename...</option>' + deletableOptions;
    }
    if (selectDeleteFolder) {
        selectDeleteFolder.innerHTML = '<option value="">Choose folder to delete...</option>' + deletableOptions;
    }
}

// Recipe extraction functions
async function extractRecipe() {
    const url = document.getElementById('recipeUrl').value.trim();
    const folderId = document.getElementById('extractFolder').value;
    
    if (!url) {
        showAlert('Please enter a recipe URL', 'warning');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showAlert('Please enter a valid URL starting with http:// or https://', 'warning');
        return;
    }
    
    try {
        showLoading('Extracting recipe...', 'This may take a few moments while we parse the webpage.');
        const response = await fetch('/api/extract-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ url: url, folder_id: folderId })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            cleanupAllModals();
            showAlert(result.message, 'success');
            document.getElementById('recipeUrl').value = '';
            loadFolders();
            loadRecipes();
        } else {
            cleanupAllModals();
            throw new Error(result.error || 'Failed to extract recipe');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error extracting recipe: ' + error.message, 'danger');
    }
}

async function saveManualRecipe() {
    const name = document.getElementById('manualName').value.trim();
    const servingSize = document.getElementById('manualServing').value.trim();
    const ingredientsText = document.getElementById('manualIngredients').value.trim();
    const instructionsText = document.getElementById('manualInstructions').value.trim();
    const folderId = document.getElementById('manualFolder').value;
    
    if (!name || !ingredientsText || !instructionsText) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    const ingredients = ingredientsText.split('\n').map(line => line.trim()).filter(line => line);
    const instructions = instructionsText.split('\n').map(line => line.trim()).filter(line => line);
    
    if (ingredients.length === 0 || instructions.length === 0) {
        showAlert('Please provide at least one ingredient and one instruction', 'warning');
        return;
    }
    
    try {
        showLoading('Saving recipe...', 'Please wait while we save your recipe.');
        const response = await fetch('/api/save-manual-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                name: name,
                serving_size: servingSize || null,
                ingredients: ingredients,
                instructions: instructions,
                folder_id: folderId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            cleanupAllModals();
            showAlert(result.message, 'success');
            document.getElementById('manualForm').reset();
            loadFolders();
            loadRecipes();
        } else {
            cleanupAllModals();
            throw new Error(result.error || 'Failed to save recipe');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error saving recipe: ' + error.message, 'danger');
    }
}

// Meal planning functions
function loadRecipeSelection() {
    const container = document.getElementById('recipeSelection');
    
    if (recipes.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <p class="text-muted">No recipes available for meal planning.</p>
                <button class="btn btn-primary" onclick="document.getElementById('extract-tab').click()">
                    <i class="fas fa-plus me-2"></i>Add Recipes First
                </button>
            </div>
        `;
        return;
    }
    
    const recipeCheckboxes = recipes.map(recipe => `
        <div class="recipe-selection-item">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${recipe.name}" id="recipe-${recipe.name.replace(/\s+/g, '-')}" onchange="updateSelectedRecipes()">
                <label class="form-check-label" for="recipe-${recipe.name.replace(/\s+/g, '-')}">
                    <strong>${recipe.name}</strong>
                    <div class="recipe-meta">
                        ${recipe.serving_size ? `${recipe.serving_size} • ` : ''}${recipe.ingredients_count} ingredients • ${recipe.instructions_count} steps
                    </div>
                </label>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = recipeCheckboxes;
    updateSelectedRecipes(); // Initialize the button state
}

function updateSelectedRecipes() {
    const checkboxes = document.querySelectorAll('#recipeSelection input[type="checkbox"]:checked');
    selectedRecipes = Array.from(checkboxes).map(cb => cb.value);
    
    // The button doesn't need to be updated here since it uses onclick="generateMealPlan()"
    // Just store the selected recipes for use in generateMealPlan()
}

async function generateMealPlan() {
    if (selectedRecipes.length === 0) {
        showAlert('Please select at least one recipe', 'warning');
        return;
    }
    
    if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
        showAlert('Please select valid meal prep dates', 'warning');
        return;
    }
    
    try {
        showLoading('Generating meal plan...', 'This may take a moment while we parse ingredients and create your grocery list.');
        const response = await fetch('/api/create-meal-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ 
                recipes: selectedRecipes,
                start_date: startDate,
                end_date: endDate
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            cleanupAllModals();
            displayGroceryList(result.grocery_list, result.meal_plan, result.date_range);
            
            // Automatically save the grocery list to the database
            setTimeout(async () => {
                try {
                    const saveResponse = await fetch('/api/grocery-lists', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            groceryList: result.grocery_list,
                            mealPlan: result.meal_plan,
                            dateRange: result.date_range
                        })
                    });
                    
                    if (saveResponse.ok) {
                        showAlert('Meal plan generated and grocery list saved successfully!', 'success');
                    } else {
                        showAlert('Meal plan generated! Click "Save List" to save for later viewing.', 'info');
                    }
                } catch (error) {
                    showAlert('Meal plan generated! Click "Save List" to save for later viewing.', 'info');
                }
                
                // Update the current plan section on the main page
                updateCurrentPlanDisplay(result.meal_plan, result.grocery_list, result.date_range);
            }, 500);
        } else {
            cleanupAllModals();
            throw new Error(result.error || 'Failed to generate meal plan');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error generating meal plan: ' + error.message, 'danger');
    }
}

function displayGroceryList(groceryList, mealPlan, dateRange) {
    // Store current grocery list data for saving
    currentGroceryListData = {
        groceryList,
        mealPlan,
        dateRange,
        createdAt: new Date().toISOString()
    };
    
    // Clear previous grocery list state for new plan
    groceryListState = {};
    
    const dateInfo = dateRange ? 
        `<div class="mb-3 p-3 bg-light rounded"><i class="fas fa-calendar me-2 text-primary"></i><strong>Meal Planning Period:</strong> ${dateRange.start} to ${dateRange.end}</div>` : '';
    
    const mealPlanDisplay = mealPlan && mealPlan.length > 0 ? 
        `<div class="mb-4">
            <h6 class="mb-2"><i class="fas fa-utensils me-2 text-success"></i>Selected Recipes:</h6>
            ${mealPlan.map(recipe => `<div class="mb-1 ms-3"><i class="fas fa-circle text-success me-2" style="font-size: 0.5rem;"></i>${recipe}</div>`).join('')}
        </div>` : '';
    
    if (!groceryList || groceryList.length === 0) {
        const container = document.getElementById('groceryList');
        if (container) {
            container.innerHTML = `
                ${dateInfo}
                ${mealPlanDisplay}
                <div class="text-center p-4">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No ingredients found in selected recipes.</p>
                </div>
            `;
        }
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('groceryListModal'));
        modal.show();
        return;
    }
    
    const groceryItems = groceryList.map((item, index) => {
        const itemId = `grocery-item-${index}`;
        const isChecked = groceryListState[itemId] || false;
        
        return `
            <div class="d-flex align-items-center p-3 border-bottom grocery-item ${isChecked ? 'completed' : ''}" id="${itemId}" style="cursor: pointer;" onclick="toggleGroceryItem('${itemId}')">
                <input class="form-check-input me-3" type="checkbox" ${isChecked ? 'checked' : ''} onchange="event.stopPropagation(); toggleGroceryItem('${itemId}')" id="check-${itemId}" style="min-width: 18px; height: 18px;">
                <label class="form-check-label grocery-item-text flex-grow-1" for="check-${itemId}" style="font-size: 1rem; line-height: 1.4; ${isChecked ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${item}</label>
            </div>
        `;
    }).join('');
    
    const container = document.getElementById('groceryList');
    if (container) {
        container.innerHTML = `
            ${dateInfo}
            ${mealPlanDisplay}
            
            <div class="grocery-list">
                <h6 class="mb-3"><i class="fas fa-shopping-cart me-2"></i>Grocery List (${groceryList.length} items)</h6>
                <div class="mb-3">
                    <button class="btn btn-outline-secondary btn-sm me-2" onclick="toggleAllItems(true)">
                        <i class="fas fa-check-square me-1"></i>Check All
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="toggleAllItems(false)">
                        <i class="fas fa-square me-1"></i>Uncheck All
                    </button>
                </div>
                ${groceryItems}
            </div>
        `;
        
        // Show the grocery list modal
        const modal = new bootstrap.Modal(document.getElementById('groceryListModal'));
        modal.show();
    }
}

function copyGroceryList() {
    const groceryItems = document.querySelectorAll('.grocery-item span');
    const listText = Array.from(groceryItems).map(item => `• ${item.textContent}`).join('\n');
    
    navigator.clipboard.writeText(listText).then(() => {
        showAlert('Grocery list copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy grocery list', 'danger');
    });
}

function printGroceryList() {
    const groceryItems = document.querySelectorAll('.grocery-item span');
    const mealPlan = document.querySelector('.meal-plan-display').innerHTML;
    const listText = Array.from(groceryItems).map(item => `• ${item.textContent}`).join('\n');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Grocery List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1, h2 { color: #333; }
                    .meal-plan { margin-bottom: 20px; }
                    .grocery-list { white-space: pre-line; }
                </style>
            </head>
            <body>
                <h1>Meal Planning Grocery List</h1>
                <h2>Meal Plan</h2>
                <div class="meal-plan">${mealPlan}</div>
                <h2>Grocery List</h2>
                <div class="grocery-list">${listText}</div>
                <script>window.print();</script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Grocery list checkbox functions
function toggleGroceryItem(itemId) {
    const item = document.getElementById(itemId);
    const checkbox = item.querySelector('input[type="checkbox"]');
    const label = item.querySelector('.grocery-item-text');
    
    // Toggle checkbox if called from clicking the item
    if (event.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
    }
    
    const isChecked = checkbox.checked;
    
    // Update visual state with better styling
    if (isChecked) {
        item.classList.add('completed');
        label.style.textDecoration = 'line-through';
        label.style.opacity = '0.6';
        item.style.backgroundColor = '#f8f9fa';
    } else {
        item.classList.remove('completed');
        label.style.textDecoration = 'none';
        label.style.opacity = '1';
        item.style.backgroundColor = '';
    }
    
    // Store state
    groceryListState[itemId] = isChecked;
    
    // Save to localStorage for persistence
    localStorage.setItem('groceryListState', JSON.stringify(groceryListState));
}

// Saved grocery lists functions
function showSavedGroceryListsModal() {
    loadSavedGroceryLists();
    const modal = new bootstrap.Modal(document.getElementById('savedGroceryListsModal'));
    modal.show();
}

async function loadSavedGroceryLists() {
    try {
        const response = await fetch('/api/grocery-lists', {
            credentials: 'same-origin'
        });
        const savedLists = await response.json();
        
        const container = document.getElementById('savedGroceryListsBody');
        
        if (!savedLists || savedLists.length === 0) {
            container.innerHTML = `
                <div class="text-center p-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Saved Grocery Lists</h5>
                    <p class="text-muted">Create a meal plan to generate your first grocery list!</p>
                    <button class="btn btn-primary" onclick="bootstrap.Modal.getInstance(document.getElementById('savedGroceryListsModal')).hide(); showMealPlanModal();">
                        <i class="fas fa-calendar-plus me-2"></i>Create Meal Plan
                    </button>
                </div>
            `;
            return;
        }
        
        const listsHTML = savedLists.map(list => {
            const createdDate = new Date(list.created_at).toLocaleDateString();
            const dateRange = list.date_range ? `${list.date_range.start} to ${list.date_range.end}` : 'No date range';
            
            return `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">
                                <i class="fas fa-calendar me-2 text-primary"></i>${dateRange}
                            </h6>
                            <small class="text-muted">Created: ${createdDate}</small>
                        </div>
                        <div>
                            <button class="btn btn-outline-primary btn-sm me-2" onclick="viewSavedGroceryList('${list.id}')">
                                <i class="fas fa-eye me-1"></i>View
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteSavedGroceryList('${list.id}')">
                                <i class="fas fa-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-success"><i class="fas fa-utensils me-1"></i>Recipes (${list.meal_plan.length})</h6>
                                <ul class="list-unstyled mb-0">
                                    ${list.meal_plan.slice(0, 3).map(recipe => `<li class="mb-1"><i class="fas fa-circle text-success me-2" style="font-size: 0.5rem;"></i>${recipe}</li>`).join('')}
                                    ${list.meal_plan.length > 3 ? `<li class="text-muted">...and ${list.meal_plan.length - 3} more</li>` : ''}
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-info"><i class="fas fa-shopping-cart me-1"></i>Grocery Items (${list.grocery_list.length})</h6>
                                <ul class="list-unstyled mb-0">
                                    ${list.grocery_list.slice(0, 4).map(item => `<li class="mb-1"><i class="fas fa-circle text-info me-2" style="font-size: 0.5rem;"></i>${item}</li>`).join('')}
                                    ${list.grocery_list.length > 4 ? `<li class="text-muted">...and ${list.grocery_list.length - 4} more</li>` : ''}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = listsHTML;
        
    } catch (error) {
        document.getElementById('savedGroceryListsBody').innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                <p class="text-muted">Error loading saved grocery lists</p>
            </div>
        `;
    }
}

async function saveCurrentGroceryList() {
    if (!currentGroceryListData) {
        showAlert('No grocery list to save', 'warning');
        return;
    }
    
    try {
        showLoading('Saving grocery list...', 'Please wait while we save your grocery list.');
        
        const response = await fetch('/api/grocery-lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(currentGroceryListData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            cleanupAllModals();
            showAlert('Grocery list saved successfully!', 'success');
        } else {
            cleanupAllModals();
            throw new Error(result.error || 'Failed to save grocery list');
        }
    } catch (error) {
        cleanupAllModals();
        showAlert('Error saving grocery list: ' + error.message, 'danger');
    }
}

async function viewSavedGroceryList(listId) {
    try {
        const response = await fetch(`/api/grocery-lists/${listId}`, {
            credentials: 'same-origin'
        });
        const savedList = await response.json();
        
        if (response.ok) {
            // Close saved lists modal and show the grocery list
            bootstrap.Modal.getInstance(document.getElementById('savedGroceryListsModal')).hide();
            
            // Display the saved grocery list
            displayGroceryList(savedList.grocery_list, savedList.meal_plan, savedList.date_range);
        } else {
            throw new Error(savedList.error || 'Failed to load grocery list');
        }
    } catch (error) {
        showAlert('Error loading grocery list: ' + error.message, 'danger');
    }
}

async function deleteSavedGroceryList(listId) {
    // Create a more user-friendly confirmation dialog
    const confirmDelete = confirm('Are you sure you want to delete this grocery list? This action cannot be undone.');
    
    if (!confirmDelete) {
        return;
    }
    
    try {
        showLoading('Deleting grocery list...', 'Please wait while we delete your grocery list.');
        
        const response = await fetch(`/api/grocery-lists/${listId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        // Always hide loading first
        hideLoading();
        
        if (response.ok) {
            showAlert('Grocery list deleted successfully!', 'success');
            // Add a small delay to ensure the loading modal is fully hidden
            setTimeout(() => {
                loadSavedGroceryLists();
            }, 100);
        } else {
            throw new Error(result.error || 'Failed to delete grocery list');
        }
    } catch (error) {
        hideLoading();
        showAlert('Error deleting grocery list: ' + error.message, 'danger');
    }
}

function toggleAllItems(checkState) {
    const checkboxes = document.querySelectorAll('.grocery-item input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = checkState;
        const item = checkbox.closest('.grocery-item');
        const itemId = item.id;
        
        if (checkState) {
            item.classList.add('completed');
        } else {
            item.classList.remove('completed');
        }
        
        groceryListState[itemId] = checkState;
    });
    
    // Save to localStorage
    localStorage.setItem('groceryListState', JSON.stringify(groceryListState));
}

// Utility functions
function showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertContainer.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 400px;';
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertContainer.parentNode) {
            alertContainer.remove();
        }
    }, 5000);
}

function showLoading(title = 'Processing...', subtitle = 'Please wait...') {
    // First ensure any existing loading modal is completely cleaned up
    hideLoading();
    
    // Wait a moment for cleanup to complete
    setTimeout(() => {
        const titleElement = document.getElementById('loadingTitle');
        const subtitleElement = document.getElementById('loadingSubtitle');
        
        if (titleElement) titleElement.textContent = title;
        if (subtitleElement) subtitleElement.textContent = subtitle;
        
        const loadingModalElement = document.getElementById('loadingModal');
        if (loadingModalElement) {
            const loadingModal = new bootstrap.Modal(loadingModalElement, {
                backdrop: 'static',
                keyboard: false
            });
            loadingModal.show();
        }
    }, 50);
}

function hideLoading() {
    // Force immediate cleanup of loading modal
    const loadingModalElement = document.getElementById('loadingModal');
    if (loadingModalElement) {
        const loadingModal = bootstrap.Modal.getInstance(loadingModalElement);
        if (loadingModal) {
            loadingModal.dispose();
        }
        loadingModalElement.style.display = 'none';
        loadingModalElement.classList.remove('show');
        loadingModalElement.setAttribute('aria-hidden', 'true');
        loadingModalElement.removeAttribute('aria-modal');
        loadingModalElement.removeAttribute('role');
    }
    
    // Aggressive cleanup of all modal artifacts
    const existingBackdrops = document.querySelectorAll('.modal-backdrop');
    existingBackdrops.forEach(backdrop => backdrop.remove());
    
    // Reset body state
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.style.marginRight = '';
}

// Function to update the current meal plan display on main page
function updateCurrentPlanDisplay(mealPlan, groceryList, dateRange) {
    const planSection = document.getElementById('currentPlanSection');
    const mealPlanElement = document.getElementById('currentMealPlan');
    const groceryListElement = document.getElementById('currentGroceryList');
    
    if (!planSection || !mealPlanElement || !groceryListElement) return;
    
    // Show the section
    planSection.style.display = 'block';
    
    // Update meal plan display
    if (mealPlan && mealPlan.length > 0) {
        const dateInfo = dateRange ? 
            `<div class="mb-3 p-2 bg-light rounded">
                <strong><i class="fas fa-calendar me-2"></i>Planning Period:</strong> ${dateRange.start} to ${dateRange.end}
            </div>` : '';
        
        const recipesHTML = mealPlan.map((recipe, index) => `
            <div class="d-flex align-items-center mb-2 p-2 border-left-success recipe-clickable" style="cursor: pointer;" onclick="showRecipeFromMealPlan('${recipe}')">
                <div class="recipe-number bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 30px; height: 30px; font-size: 0.8rem; font-weight: bold;">
                    ${index + 1}
                </div>
                <div class="flex-grow-1">
                    <span class="fw-medium">${recipe}</span>
                </div>
            </div>
        `).join('');
        
        mealPlanElement.innerHTML = `
            ${dateInfo}
            <div class="recipes-list">
                ${recipesHTML}
            </div>
            <div class="mt-3 text-center">
                <small class="text-muted">${mealPlan.length} recipe${mealPlan.length !== 1 ? 's' : ''} planned</small>
            </div>
        `;
    }
    
    // Update grocery list display
    if (groceryList && groceryList.length > 0) {
        const groceryHTML = groceryList.slice(0, 8).map(item => `
            <div class="d-flex align-items-center mb-1">
                <i class="fas fa-circle text-info me-2" style="font-size: 0.4rem;"></i>
                <small style="color: #0F172A !important;">${item}</small>
            </div>
        `).join('');
        
        const moreItems = groceryList.length > 8 ? 
            `<div class="mt-2 text-center">
                <small class="text-muted">...and ${groceryList.length - 8} more items</small>
            </div>` : '';
        
        groceryListElement.innerHTML = `
            <div class="grocery-preview grocery-clickable" style="color: #0F172A !important; cursor: pointer;" onclick="showFullGroceryList()">
                ${groceryHTML}
                ${moreItems}
            </div>
            <div class="mt-3 text-center">
                <small style="color: #64748B !important;">${groceryList.length} total items</small>
                <div class="mt-2">
                    <small class="text-info">Click to view full list</small>
                </div>
            </div>
        `;
        
        // Force all text elements to be dark after rendering
        setTimeout(() => {
            const allElements = groceryListElement.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.tagName !== 'I') { // Don't change icon colors
                    el.style.color = '#0F172A';
                }
            });
        }, 100);
    }
}

// Function to load and display the most recent meal plan
async function loadCurrentMealPlan() {
    try {
        const response = await fetch('/api/grocery-lists');
        
        if (!response.ok) {
            console.log('Failed to fetch grocery lists:', response.status);
            return;
        }
        
        const savedLists = await response.json();
        console.log('Loaded grocery lists:', savedLists);
        
        if (savedLists && savedLists.length > 0) {
            // Get the most recent grocery list (they're ordered by created_at desc)
            const mostRecent = savedLists[0];
            console.log('Displaying most recent plan:', mostRecent);
            
            // Store the current grocery list data globally for click access
            currentGroceryListData = {
                groceryList: mostRecent.grocery_list,
                mealPlan: mostRecent.meal_plan,
                dateRange: mostRecent.date_range,
                createdAt: mostRecent.created_at
            };
            
            updateCurrentPlanDisplay(mostRecent.meal_plan, mostRecent.grocery_list, mostRecent.date_range);
        } else {
            console.log('No saved grocery lists found');
        }
    } catch (error) {
        console.log('Error loading meal plan:', error);
    }
}

// Function to show recipe details when clicked from meal plan
async function showRecipeFromMealPlan(recipeName) {
    try {
        // Find the recipe in the recipes list
        const response = await fetch('/api/recipes', {
            credentials: 'same-origin'
        });
        const allRecipes = await response.json();
        
        console.log('Looking for recipe:', recipeName);
        
        // Find the recipe by name (each recipe object has folder_id and name)
        for (const recipe of allRecipes) {
            if (recipe.name === recipeName) {
                console.log('Found recipe:', recipe);
                showRecipeDetails(recipe.folder_id, recipeName);
                return;
            }
        }
        
        showAlert('Recipe not found', 'warning');
    } catch (error) {
        console.error('Full error:', error);
        showAlert('Error loading recipe: ' + error.message, 'danger');
    }
}

// Smart Recipe Discovery Functions
function handleCravingSearch(event) {
    if (event.key === 'Enter') {
        performCravingSearch();
    }
}

function performCravingSearch() {
    const searchTerm = document.getElementById('cravingSearch').value.trim();
    if (!searchTerm) {
        showAlert('Please enter what you\'re craving to search for recipes', 'warning');
        return;
    }
    
    // Get selected search type
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    
    if (searchType === 'saved') {
        searchSavedRecipes(searchTerm);
    } else {
        searchWebRecipes(searchTerm);
    }
}

async function searchSavedRecipes(searchTerm = null) {
    const term = searchTerm || document.getElementById('cravingSearch').value.trim();
    if (!term) {
        showAlert('Please enter what you\'re craving to search for recipes', 'warning');
        return;
    }
    
    try {
        showLoading('Searching your recipes...', 'Looking through your saved recipes for matches');
        
        const response = await fetch('/api/recipe-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ description: term, search_type: 'saved' })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (response.ok) {
            displaySearchResults(result.recipes, 'Your Saved Recipes');
        } else {
            throw new Error(result.error || 'Search failed');
        }
    } catch (error) {
        hideLoading();
        showAlert('Error searching recipes: ' + error.message, 'danger');
    }
}

async function searchWebRecipes(searchTerm = null) {
    const term = searchTerm || document.getElementById('cravingSearch').value.trim();
    if (!term) {
        showAlert('Please enter what you\'re craving to search for recipes', 'warning');
        return;
    }
    
    try {
        showLoading('Discovering new recipes...', 'Finding recipe suggestions based on your description');
        
        const response = await fetch('/api/recipe-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ description: term, search_type: 'web' })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (response.ok) {
            displaySearchResults(result.recipes, 'Recipe Suggestions');
        } else {
            throw new Error(result.error || 'Search failed');
        }
    } catch (error) {
        hideLoading();
        showAlert('Error discovering recipes: ' + error.message, 'danger');
    }
}

function displaySearchResults(recipes, title) {
    const resultsSection = document.getElementById('searchResultsSection');
    const resultsContainer = document.getElementById('searchResults');
    
    if (!recipes || recipes.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No recipes found</h5>
                <p class="text-muted">Try different keywords or search for new recipes online</p>
            </div>
        `;
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    const recipesHTML = recipes.map(recipe => {
        const matchScore = recipe.match_score ? 
            `<div class="mb-2">
                <span class="badge bg-success">Match: ${Math.round(recipe.match_score * 100)}%</span>
            </div>` : '';
        
        const servingInfo = recipe.serving_size ? 
            `<p class="text-muted mb-2"><i class="fas fa-users me-1"></i>${recipe.serving_size}</p>` : '';
        
        const ingredients = recipe.ingredients.slice(0, 3).map(ing => 
            `<li class="text-muted">${ing}</li>`
        ).join('');
        
        const moreIngredients = recipe.ingredients.length > 3 ? 
            `<li class="text-muted">...and ${recipe.ingredients.length - 3} more</li>` : '';
        
        // Different buttons based on whether it's a saved recipe or web recipe
        // Use data attributes to safely pass recipe data
        const recipeId = `recipe-${Math.random().toString(36).substr(2, 9)}`;
        
        const actionButtons = recipe.url ? 
            `<button class="btn btn-outline-primary btn-sm me-2 view-web-recipe" data-recipe-id="${recipeId}">
                <i class="fas fa-eye me-1"></i>View Recipe
            </button>
            <button class="btn btn-success btn-sm save-web-recipe" data-recipe-id="${recipeId}">
                <i class="fas fa-save me-1"></i>Save Recipe
            </button>` :
            `<button class="btn btn-primary btn-sm me-2 view-saved-recipe" data-recipe-name="${encodeURIComponent(recipe.name)}">
                <i class="fas fa-eye me-1"></i>View Recipe
            </button>
            <button class="btn btn-outline-success btn-sm add-to-meal-plan" data-recipe-name="${encodeURIComponent(recipe.name)}">
                <i class="fas fa-plus me-1"></i>Add to Meal Plan
            </button>`;
        
        // Store recipe data globally for reference
        window.recipeData = window.recipeData || {};
        window.recipeData[recipeId] = recipe;
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">${recipe.name}</h5>
                            ${matchScore}
                            ${servingInfo}
                            <h6 class="text-success">Ingredients:</h6>
                            <ul class="mb-0">
                                ${ingredients}
                                ${moreIngredients}
                            </ul>
                        </div>
                        <div class="col-md-4 text-end">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    resultsContainer.innerHTML = `
        <div class="mb-3">
            <h6 class="text-primary">${title} (${recipes.length} found)</h6>
        </div>
        ${recipesHTML}
    `;
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Add event listeners for recipe buttons
    addRecipeButtonListeners();
}

function addRecipeButtonListeners() {
    // View web recipe buttons
    document.querySelectorAll('.view-web-recipe').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            const recipe = window.recipeData[recipeId];
            if (recipe) {
                showWebRecipeModal(encodeURIComponent(JSON.stringify(recipe)));
            }
        });
    });
    
    // Save web recipe buttons
    document.querySelectorAll('.save-web-recipe').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            const recipe = window.recipeData[recipeId];
            if (recipe) {
                saveWebRecipeFromData(encodeURIComponent(JSON.stringify(recipe)));
            }
        });
    });
    
    // View saved recipe buttons
    document.querySelectorAll('.view-saved-recipe').forEach(button => {
        button.addEventListener('click', function() {
            const recipeName = decodeURIComponent(this.getAttribute('data-recipe-name'));
            showSavedRecipeDetails(recipeName);
        });
    });
    
    // Add to meal plan buttons
    document.querySelectorAll('.add-to-meal-plan').forEach(button => {
        button.addEventListener('click', function() {
            const recipeName = decodeURIComponent(this.getAttribute('data-recipe-name'));
            addToMealPlan(recipeName);
        });
    });
}

function showWebRecipeModal(recipeDataString) {
    try {
        const recipe = JSON.parse(decodeURIComponent(recipeDataString));
        
        const ingredientsHtml = recipe.ingredients.map(ingredient => 
            `<li class="mb-1">${ingredient}</li>`
        ).join('');
        
        const instructionsHtml = recipe.instructions.map((instruction, index) => 
            `<li class="mb-2"><strong>Step ${index + 1}:</strong> ${instruction}</li>`
        ).join('');
        
        const servingInfo = recipe.serving_size ? 
            `<p class="text-muted mb-3"><i class="fas fa-users me-2"></i>Serves: ${recipe.serving_size}</p>` : '';
        
        const modalContent = `
            <div class="modal fade" id="webRecipeDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${recipe.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${servingInfo}
                            
                            <h6 class="text-success mb-3">
                                <i class="fas fa-list-ul me-2"></i>Ingredients (${recipe.ingredients.length})
                            </h6>
                            <ul class="list-unstyled mb-4">
                                ${ingredientsHtml}
                            </ul>
                            
                            <h6 class="text-primary mb-3">
                                <i class="fas fa-clipboard-list me-2"></i>Instructions (${recipe.instructions.length} steps)
                            </h6>
                            <ol class="mb-4">
                                ${instructionsHtml}
                            </ol>
                        </div>
                        <div class="modal-footer">
                            ${recipe.url ? `<button type="button" class="btn btn-outline-secondary" onclick="window.open('${recipe.url}', '_blank')">
                                <i class="fas fa-external-link-alt me-1"></i>View Original
                            </button>` : ''}
                            <button type="button" class="btn btn-success" onclick="saveWebRecipe('${encodeURIComponent(recipe.name)}', '${encodeURIComponent(recipe.url || '')}')">
                                <i class="fas fa-save me-1"></i>Save Recipe
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('webRecipeDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body and show
        document.body.insertAdjacentHTML('beforeend', modalContent);
        const modal = new bootstrap.Modal(document.getElementById('webRecipeDetailsModal'));
        modal.show();
        
    } catch (error) {
        showAlert('Error displaying recipe details: ' + error.message, 'danger');
    }
}

function saveWebRecipe(recipeName, recipeUrl) {
    // Show folder selection modal for URL-based saving (legacy)
    showSaveToFolderModal(recipeName, recipeUrl);
}

function saveWebRecipeFromData(recipeDataString) {
    try {
        const recipe = JSON.parse(decodeURIComponent(recipeDataString));
        // Show folder selection modal with complete recipe data
        showSaveToFolderModalWithData(recipe);
    } catch (error) {
        showAlert('Error processing recipe data: ' + error.message, 'danger');
    }
}

function showSaveToFolderModal(recipeName, recipeUrl) {
    // Create folder selection modal content
    const folderOptions = folders.map(folder => 
        `<option value="${folder.id}">${folder.name}</option>`
    ).join('');
    
    const modalContent = `
        <div class="modal fade" id="saveToFolderModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Save Recipe to Folder</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Recipe:</strong> ${recipeName}</p>
                        <div class="mb-3">
                            <label for="selectSaveFolder" class="form-label">Choose folder:</label>
                            <select class="form-select" id="selectSaveFolder">
                                <option value="uncategorized">Uncategorized</option>
                                ${folderOptions}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" onclick="confirmSaveWebRecipe('${recipeName}', '${recipeUrl}')">Save Recipe</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('saveToFolderModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('saveToFolderModal'));
    modal.show();
}

function showSaveToFolderModalWithData(recipe) {
    // Store recipe data globally to avoid encoding issues
    window.currentSaveRecipe = recipe;
    
    const folderOptions = folders.map(folder => 
        `<option value="${folder.id}">${folder.name}</option>`
    ).join('');
    
    const modalContent = `
        <div class="modal fade" id="saveToFolderModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Save Recipe to Folder</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Recipe:</strong> ${recipe.name}</p>
                        <p class="text-muted">Contains ${recipe.ingredients.length} ingredients and ${recipe.instructions.length} instructions</p>
                        <div class="mb-3">
                            <label for="selectSaveFolder" class="form-label">Choose folder:</label>
                            <select class="form-select" id="selectSaveFolder">
                                <option value="uncategorized">Uncategorized</option>
                                ${folderOptions}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" id="confirmSaveBtn">Save Recipe</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('saveToFolderModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Add event listener for save button
    document.getElementById('confirmSaveBtn').addEventListener('click', confirmSaveCompleteRecipe);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('saveToFolderModal'));
    modal.show();
}

async function confirmSaveCompleteRecipe() {
    const selectedFolder = document.getElementById('selectSaveFolder').value;
    
    try {
        const recipe = window.currentSaveRecipe;
        
        if (!recipe) {
            throw new Error('Recipe data not found');
        }
        
        // Hide the folder selection modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('saveToFolderModal'));
        modal.hide();
        
        showLoading('Saving recipe...', 'Saving complete recipe details to your collection');
        
        const response = await fetch('/api/save-search-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ 
                recipe: recipe,
                folder_id: selectedFolder
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (response.ok) {
            showAlert(`Recipe "${recipe.name}" saved successfully to ${selectedFolder === 'uncategorized' ? 'Uncategorized' : folders.find(f => f.id === selectedFolder)?.name || selectedFolder}!`, 'success');
            loadFolders(); // Refresh folder counts
            loadRecipes(); // Refresh the recipes list
            
            // Clean up modal and global data
            setTimeout(() => {
                const modalElement = document.getElementById('saveToFolderModal');
                if (modalElement) {
                    modalElement.remove();
                }
                delete window.currentSaveRecipe;
            }, 500);
        } else {
            throw new Error(result.error || 'Failed to save recipe');
        }
    } catch (error) {
        hideLoading();
        showAlert('Error saving recipe: ' + error.message, 'danger');
    }
}

async function confirmSaveWebRecipe(recipeName, recipeUrl) {
    const selectedFolder = document.getElementById('selectSaveFolder').value;
    
    try {
        // Hide the folder selection modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('saveToFolderModal'));
        modal.hide();
        
        showLoading('Saving recipe...', 'Extracting recipe details and saving to your collection');
        
        const response = await fetch('/api/save-search-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ 
                recipe_name: recipeName,
                recipe_url: recipeUrl,
                folder_id: selectedFolder
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (response.ok) {
            showAlert(`Recipe "${recipeName}" saved successfully to ${selectedFolder === 'uncategorized' ? 'Uncategorized' : folders.find(f => f.id === selectedFolder)?.name || selectedFolder}!`, 'success');
            loadFolders(); // Refresh folder counts
            loadRecipes(); // Refresh the recipes list
            
            // Clean up modal
            setTimeout(() => {
                const modalElement = document.getElementById('saveToFolderModal');
                if (modalElement) {
                    modalElement.remove();
                }
            }, 500);
        } else {
            throw new Error(result.error || 'Failed to save recipe');
        }
    } catch (error) {
        hideLoading();
        showAlert('Error saving recipe: ' + error.message, 'danger');
    }
}

async function showSavedRecipeDetails(recipeName) {
    // Find the recipe in the recipes list and show its details
    try {
        const response = await fetch('/api/recipes', {
            credentials: 'same-origin'
        });
        const allRecipes = await response.json();
        
        for (const recipe of allRecipes) {
            if (recipe.name === recipeName) {
                showRecipeDetails(recipe.folder_id, recipeName);
                return;
            }
        }
        
        showAlert('Recipe not found', 'warning');
    } catch (error) {
        showAlert('Error loading recipe: ' + error.message, 'danger');
    }
}

function addToMealPlan(recipeName) {
    // For now, just show the meal plan modal and suggest the user select the recipe
    showMealPlanModal();
    showAlert(`Open the meal planner and look for "${recipeName}" in your recipes`, 'info');
}

// Function to show full grocery list when clicked
function showFullGroceryList() {
    if (currentGroceryListData) {
        displayGroceryList(
            currentGroceryListData.groceryList,
            currentGroceryListData.mealPlan,
            currentGroceryListData.dateRange
        );
    } else {
        showAlert('No grocery list available', 'warning');
    }
}

// Add event listeners for recipe action buttons using event delegation
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('view-web-recipe-btn') || e.target.closest('.view-web-recipe-btn')) {
        const button = e.target.classList.contains('view-web-recipe-btn') ? e.target : e.target.closest('.view-web-recipe-btn');
        const url = decodeURIComponent(button.dataset.url);
        viewWebRecipe(url);
    }
    
    if (e.target.classList.contains('save-web-recipe-btn') || e.target.closest('.save-web-recipe-btn')) {
        const button = e.target.classList.contains('save-web-recipe-btn') ? e.target : e.target.closest('.save-web-recipe-btn');
        const name = decodeURIComponent(button.dataset.name);
        const url = decodeURIComponent(button.dataset.url);
        saveWebRecipe(name, url);
    }
    
    if (e.target.classList.contains('view-saved-recipe-btn') || e.target.closest('.view-saved-recipe-btn')) {
        const button = e.target.classList.contains('view-saved-recipe-btn') ? e.target : e.target.closest('.view-saved-recipe-btn');
        const name = decodeURIComponent(button.dataset.name);
        showSavedRecipeDetails(name);
    }
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadFolders();
    loadRecipes();
    loadCurrentMealPlan();
});
