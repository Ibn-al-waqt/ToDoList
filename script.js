//Adding tags
// Reordered script.js: ensure variables are declared before any functions that use them

// Element references (declare first so functions can rely on them)
const btnTag = document.getElementById("tagButton");
const userTagInput = document.getElementById("tagField");
const tempTags = document.getElementById("tempTags");

const noteGrid = document.querySelector(".note-grid");
const txtArea = document.getElementById("msg");
const taskBtn = document.getElementById("nameButton");
const taskInput = document.getElementById("nameField");
const fullTags = document.getElementById('fullTags');
// active filter tags (multi-select) - notes must contain ALL tags in this set to be shown
const activeFilterTags = new Set();

function updateNotesVisibility() {
    const notes = Array.from(document.querySelectorAll('.note'));
    if (activeFilterTags.size === 0) {
        notes.forEach(card => { card.style.display = ''; });
        return;
    }
    notes.forEach(card => {
        const cardTagEls = Array.from(card.querySelectorAll('.note-tags span[data-tag]'));
        const cardTagSet = new Set(cardTagEls.map(s => s.dataset.tag));
        const matchesAll = Array.from(activeFilterTags).every(t => cardTagSet.has(t));
        card.style.display = matchesAll ? '' : 'none';
    });
}

function selectTagSpan(span) {
    if (!span || !span.dataset) return;
    const tag = span.dataset.tag;
    if (!tag) return;
    activeFilterTags.add(tag);
    span.classList.add('active-filter');
    try { fullTags.prepend(span); } catch (e) {}
    updateNotesVisibility();
}

function deselectTagSpan(span) {
    if (!span || !span.dataset) return;
    const tag = span.dataset.tag;
    if (!tag) return;
    activeFilterTags.delete(tag);
    span.classList.remove('active-filter');
    updateNotesVisibility();
}

function toggleFilterForSpan(span) {
    if (!span || !span.dataset) return;
    const tag = span.dataset.tag;
    if (!tag) return;
    if (activeFilterTags.has(tag)) {
        deselectTagSpan(span);
    } else {
        selectTagSpan(span);
    }
}

function ensureFullTagClickable(span) {
    if (!span || span._clickable) return;
    span.style.cursor = 'pointer';
    span.tabIndex = 0;
    span.addEventListener('click', () => toggleFilterForSpan(span));
    span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFilterForSpan(span);
        }
    });
    span._clickable = true;
}

// Helper: get normalized tag text from a tag element
function getTagTextFromElem(el) {
    if (!el) return '';
    if (el.dataset && el.dataset.tag) return el.dataset.tag;
    if (el.firstChild && el.firstChild.textContent) return el.firstChild.textContent.trim();
    return (el.textContent || '').trim();
}

// Helper: create a remove button wired to removeTagAndFull for given tag element
function createRemoveButtonFor(tagEl) {
    const b = document.createElement('button');
    b.textContent = '✖';
    b.classList.add('remove-tag');
    b.addEventListener('click', () => removeTagAndFull(tagEl));
    return b;
}

// Helper: remove a tag element and its matching entries from #fullTags
function removeTagAndFull(tagEl) {
    const text = (tagEl.dataset && tagEl.dataset.tag) ? tagEl.dataset.tag : (tagEl.firstChild ? tagEl.firstChild.textContent.trim() : tagEl.textContent.trim());
    // remove the tag element from wherever it is (note or temp)
    if (tagEl && tagEl.remove) tagEl.remove();
    // update counts in #fullTags (removes the entry only when count becomes 0)
    updateFullTagCount(text);
}

// Update or create the tag entry in #fullTags showing how many notes reference it
function updateFullTagCount(text) {
    if (!fullTags) return;

    // count how many note tags currently reference this text (use dataset.tag for reliability)
    const remainingNoteTags = Array.from(document.querySelectorAll('.note .note-tags span')).filter(s => s.dataset && s.dataset.tag === text);
    const count = remainingNoteTags.length;

    // find existing fullTags span by data-tag among direct children
    const existing = Array.from(fullTags.children).find(s => s.dataset && s.dataset.tag === text);

    if (count === 0) {
        if (existing) existing.remove();
        return;
    }

    if (!existing) {
        const spanFull = document.createElement('span');
        spanFull.dataset.tag = text;
        // create a separate text node span and a count span for reliable matching
        const textSpan = document.createElement('span');
        textSpan.className = 'tag-text';
        textSpan.textContent = text;
        const countSpan = document.createElement('span');
        countSpan.className = 'tag-count';
        countSpan.textContent = `(${count})`;
        spanFull.appendChild(textSpan);
        spanFull.appendChild(countSpan);
        fullTags.appendChild(spanFull);
        // make this new fullTags entry interactive for filtering
        ensureFullTagClickable(spanFull);
    } else {
        let countSpan = existing.querySelector('.tag-count');
        if (!countSpan) {
            countSpan = document.createElement('span');
            countSpan.className = 'tag-count';
            existing.appendChild(countSpan);
        }
        countSpan.textContent = `(${count})`;
    }
    // Show horizontal scrollbar on #fullTags only when it actually overflows
    if (fullTags) {
        if (fullTags.scrollWidth > fullTags.clientWidth + 1) fullTags.classList.add('show-scroll'); else fullTags.classList.remove('show-scroll');
    }
}

// Tag creation handler
if (btnTag) {
    btnTag.addEventListener("click", () => {
        if (!userTagInput || !tempTags) return;
        let userValue = (userTagInput.value || '').trim();
        if (userValue === "") return;

        if (!userValue.startsWith("#")) {
            userValue = "#" + userValue.replace("#", "");
        }

        const existingTags = tempTags ? [...tempTags.querySelectorAll("span")].map(tag => getTagTextFromElem(tag)) : [];
        if (existingTags.includes(userValue)) {
            userTagInput.value = "";
            return;
        }

        const newTag = document.createElement("span");
        const tagText = document.createTextNode(userValue);
        // store normalized tag text for reliable matching across containers
        newTag.dataset.tag = userValue;

        const removeBtn = createRemoveButtonFor(newTag);

        newTag.appendChild(tagText);
        newTag.appendChild(removeBtn);
        tempTags.appendChild(newTag);

        userTagInput.value = "";
    });
}

// Task creation handler
if (taskBtn) {
    taskBtn.addEventListener("click", () => {
        if (!noteGrid || !tempTags || !txtArea || !taskInput) return;
        let taskName = (taskInput.value || '').trim();
        let taskDesc = (txtArea.value || '').trim();

        if (taskName === "" || taskDesc === "") return;
        // helper to escape HTML in user content
        function escapeHtml(s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function nl2br(s) { return escapeHtml(s).replace(/\n/g, '<br>'); }

        // create an excerpt (short preview) for the front of the card
        const EXCERPT_CHARS = 220;
        const excerptText = taskDesc.length > EXCERPT_CHARS ? taskDesc.slice(0, EXCERPT_CHARS).trim() + '…' : taskDesc;

        let card = document.createElement("div");
        card.className = "note";

        card.innerHTML = `
            <div class="note-card">
                <div class="note-front">
                    <div class="note-header">${escapeHtml(taskName)} <button class="remove-note">✖</button></div>
                    <div class="note-excerpt"><p>${nl2br(excerptText)}</p></div>
                </div>
                <div class="note-back">
                    <div class="note-body"><p>${nl2br(taskDesc)}</p></div>
                    <div class="note-actions"><button class="show-less">Close</button></div>
                </div>
            </div>
            <div class="tags note-tags"></div>
        `;

        // Insert the new card into the DOM first so tag counting sees it
        noteGrid.append(card);

        // Move all tags from the temp tag container into the new note's tag area
        const noteTagContainer = card.querySelector('.note-tags');
        // Ensure the note-tags container sits inside the front of the card (bottom of front)
        const front = card.querySelector('.note-front');
        if (noteTagContainer && front && noteTagContainer.parentElement !== front) {
            front.appendChild(noteTagContainer);
        }
        const tempTagSpans = Array.from(tempTags.querySelectorAll('span'));
        tempTagSpans.forEach(orig => {
            // capture text before manipulating the element
            const text = orig.firstChild ? orig.firstChild.textContent.trim() : orig.textContent.trim();
            if (!text) return;

            // append the existing tag element into the note (this removes it from tempTags)
            noteTagContainer.appendChild(orig);

            // ensure the tag's remove button removes the tag regardless of location
            const btn = orig.querySelector('button.remove-tag');
            if (btn) {
                btn.onclick = () => removeTagAndFull(orig);
            } else {
                const b = document.createElement('button');
                b.textContent = '✖';
                b.classList.add('remove-tag');
                b.addEventListener('click', () => removeTagAndFull(orig));
                orig.appendChild(b);
            }

            // update the main tags list counts (will create or update the entry)
            updateFullTagCount(text);
        });

        // Ensure the tag area shows from the start (left-most) when the note is created
        if (noteTagContainer) noteTagContainer.scrollLeft = 0;

        // move the tags container into the front so tags are at the bottom of the front
        if (noteTagContainer && front && noteTagContainer.parentElement !== front) front.appendChild(noteTagContainer);

        // create and place the read-more button inside the excerpt (it will be shown only if clipped)
        const excerptEl = card.querySelector('.note-excerpt');
        let readMoreBtn = null;
        if (excerptEl) {
            readMoreBtn = document.createElement('button');
            readMoreBtn.className = 'read-more';
            readMoreBtn.setAttribute('aria-label', 'Expand');
            readMoreBtn.title = 'Expand';
            // insert a chevron SVG so the button shows an icon instead of text
            readMoreBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M6 9l6 6 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
            excerptEl.appendChild(readMoreBtn);
            readMoreBtn.addEventListener('click', () => card.classList.add('flipped'));
        }

        // helper: show horizontal scrollbar only when tags overflow
        function updateTagScrollVisibilityFor(node) {
            const tags = node.querySelector('.note-tags');
            if (!tags) return;
            if (tags.scrollWidth > tags.clientWidth + 1) tags.classList.add('show-scroll'); else tags.classList.remove('show-scroll');
        }

        // If the excerpt overflows after tags move, update its clipped state
        function updateClipForCard(c) {
            const ex = c.querySelector('.note-excerpt');
            if (!ex) return;
            if (ex.scrollHeight > ex.clientHeight + 2) ex.classList.add('clipped'); else ex.classList.remove('clipped');
            updateTagScrollVisibilityFor(c);
        }

        // Wire the note-level remove button to delete the whole note
        // and remove its tags from the main tags container
        const removeNoteBtn = card.querySelector('.remove-note');
        if (removeNoteBtn) removeNoteBtn.addEventListener('click', () => {
            const noteTagSpans = Array.from(card.querySelectorAll('.note-tags span'));
            noteTagSpans.forEach(tagEl => removeTagAndFull(tagEl));
            card.remove();
        });

        // Wire show-less handler (close on back)
        const showLessBtn = card.querySelector('.show-less');
        if (showLessBtn) showLessBtn.addEventListener('click', () => {
            card.classList.remove('flipped');
        });

        // After wiring flip handlers, ensure excerpt clipping/fade state is correct

        // run for the new card
        updateClipForCard(card);

        // apply active multi-tag filter to this newly created card so it respects the current selection
        if (activeFilterTags.size) {
            const cardTagEls = Array.from(card.querySelectorAll('.note-tags span[data-tag]'));
            const cardTagSet = new Set(cardTagEls.map(s => s.dataset.tag));
            const matchesAll = Array.from(activeFilterTags).every(t => cardTagSet.has(t));
            card.style.display = matchesAll ? '' : 'none';
        }

        // also update on window resize
        window.addEventListener('resize', () => updateClipForCard(card));

       txtArea.value = "";
       taskInput.value = "";
    });
};

// Initialize flip/read-more handlers and clipping for existing notes on the page
function initExistingNotes() {
    const notes = Array.from(document.querySelectorAll('.note'));
    notes.forEach(card => {
        // attach remove handler if present
        const removeNoteBtn = card.querySelector('.remove-note');
        if (removeNoteBtn && !removeNoteBtn._attached) {
            removeNoteBtn.addEventListener('click', () => {
                const noteTagSpans = Array.from(card.querySelectorAll('.note-tags span'));
                noteTagSpans.forEach(tagEl => removeTagAndFull(tagEl));
                card.remove();
            });
            removeNoteBtn._attached = true;
        }

        const readMoreBtn = card.querySelector('.read-more');
        const showLessBtn = card.querySelector('.show-less');
        // ensure tags are inside the front for existing notes (in case HTML placed them outside)
        const existingTags = card.querySelector('.note-tags');
        const front = card.querySelector('.note-front');
        if (existingTags && front && existingTags.parentElement !== front) front.appendChild(existingTags);

        // if there is a read-more button outside the excerpt (from older markup), move it into the excerpt
        const ex = card.querySelector('.note-excerpt');
        if (readMoreBtn && ex && readMoreBtn.parentElement !== ex) {
            ex.appendChild(readMoreBtn);
        }

        // normalize existing read-more buttons: use an accessible chevron icon and wire handler
        if (readMoreBtn) {
            readMoreBtn.setAttribute('aria-label', 'Expand');
            readMoreBtn.title = 'Expand';
            readMoreBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M6 9l6 6 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
        }
        if (readMoreBtn && !readMoreBtn._attached) {
            readMoreBtn.addEventListener('click', () => card.classList.add('flipped'));
            readMoreBtn._attached = true;
        }
        if (showLessBtn && !showLessBtn._attached) {
            showLessBtn.addEventListener('click', () => card.classList.remove('flipped'));
            showLessBtn._attached = true;
        }

        // update clip for excerpt and show/hide tag scrollbar
        if (ex) {
            if (ex.scrollHeight > ex.clientHeight + 2) ex.classList.add('clipped'); else ex.classList.remove('clipped');
        }
        // update tag scrollbar visibility
        if (existingTags) {
            if (existingTags.scrollWidth > existingTags.clientWidth + 1) existingTags.classList.add('show-scroll'); else existingTags.classList.remove('show-scroll');
        }
    });
    // ensure existing #fullTags entries are interactive
    if (fullTags) {
        Array.from(fullTags.children).forEach(ch => ensureFullTagClickable(ch));
    }
}

// run on load
document.addEventListener('DOMContentLoaded', initExistingNotes);
