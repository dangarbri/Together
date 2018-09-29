/**
 * Format for a ListItem to be sent to paired device.
 * Uses objects for easy access
 * 
 * ListContent - Array - Array of List classes
 * Format:
 * {
 *     List1 : {
 *         Item1: {
 *            Strikethrough: false,
 *            Removed: false
 *         }
 *     },
 *     List2: {
 *          ...
 *     }
 *     ...
 * }
 * 
 * Object List:
 *   Properties:
 *      Name - String - name of the list
 *      Items - Array - Array of ListItems
 *   Format:
 *      { Name: Items }
 *      
 * 
 * Object ListItem:
 *   Properties:
 *      Text - String - Text for list item
 *      Strikethrough - bool - determine if item has a strikethrough in it
 *      Removed - bool - determine if item has been deleted from the list
 *      Time - Date String - last updated timestamp, turn into Date object with new Date(string)
 *   Format:
 *      { Text: {Strikethrough: boolean, Removed: boolean, Time: Date} }
 *     
 * List Sync Flow:
 *      Lists need to stay in sync between devices.
 *      When a list is modified on one device, each change is posted to
 *      the server with a timestamp. If the timestamp is greater than the current
 *      time, then that item is updated
 * 
 * TODO: Figure out when it's appropriate to remove "removed" items from the list
 */

var Lists = {};

(function (Lists) {
    var addedListener = false;
    var gSyncing = false;
    /**
     * Global list object. Contains info on all the list content
     */
    var ListContent = {};

    /**
     * List Class, see file header for details
     * @param {string} name - name of new list
     */
    function CreateList(name) {
        ListContent[name] = {};
        Lists.PostList();
    }

    /**
     * ListItem Class, see file header for details
     * @param {string} name - Name of the list
     * @param {string} text - text for list item
     */
    function CreateListItem(list, text) {
        ListContent[list][text] = {
            Strikethrough: false,
            Removed: false,
            Time: new Date()
        }
    }

    /**
     * Add a new list to the page
     * @param {string} name Name of the new list
     */
    function AddNewList(name) {
        name = name.trim()
        if (name === "") {
            return;
        }
        var listContainer = document.getElementById('js-list-container');
        var listHtml = `<li class="accordion-item">
                            <a href="#" class="item-link item-content">
                                <div class="item-inner">
                                    <div class="item-title">` + name + `</div>
                                </div>
                            </a>
                            <div class="accordion-item-content sub-list">
                                <ul id="js-` + name + `">
                                    <li class="item-content">
                                        <div class="item-inner">
                                            <div class="item-title" style="width: 100%;">
                                                <div class="item-input-wrap">
                                                <input id="js-` + name + `-input" type="text" name="text" placeholder="New List">
                                                </div>
                                            </div>
                                            <div class="item-after">
                                                <button onclick="Lists.AddListItem('` + name + `')" class="button" id="js-list-new-btn">
                                                    <i class="icon f7-icons">add</i>
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </li>`
        listContainer.innerHTML += listHtml;
        // Add to json data
        CreateList(name);
    }

    /**
     * 
     * @param {string} list Name of list we're adding to
     * @param {string} val May be null, if inputEl is null, then val will be checked as well.
     * @param {bool} strikethrough - optional param, add the item already stricken
     */
    var gLocalCount = 0; // for generating unique ids for auto-strikethrough
    Lists.AddListItem = function(list, val, strikethrough) {
        var container = document.getElementById('js-' + list);
        var inputEl   = document.getElementById('js-' + list + '-input');
        if (typeof(strikethrough) === "undefined") {
            strikethrough = false;
        }
        value = inputEl.value.trim();
        if (value === "") {
            if (val == null) {
                return;
            } else {
                value = val;
            }
        }
        var listItem = `<li class="item-content" onclick="Lists.ToggleStrikethrough(this)" data-pre-strikethrough="`+ strikethrough +`">
                            <div class="item-inner">
                                <div class="item-title">
                                    ` + value + `
                                </div>
                                <div data-list="`+list+`" data-value="`+value+`" class="item-after js-close-btn" style="display: none;" onclick="Lists.RemoveItem(this)">
                                    <button class="button">
                                        <i class="icon f7-icons">close</i>
                                    </button>
                                </div>
                            </div>
                        </li>`
        inputEl.value = "";
        container.innerHTML += listItem;

        // Add to json data
        CreateListItem(list, value);
        Lists.PostList();
    }

    /**
     * Mark the list item as completed and moves it to the bottom of the list
     * @param {HTML Element} listItem List item to mark up
     */
    Lists.ToggleStrikethrough = function(listItem) {
        var stricken = listItem.getAttribute('data-strikethrough');
        var parent = listItem.parentNode;
        // Has list data
        var closeBtn = listItem.getElementsByClassName('js-close-btn')[0];
        var list = closeBtn.getAttribute('data-list');
        var item = closeBtn.getAttribute('data-value');

        /**
         * Happens when click of remove button bubbles up to this
         */
        if (!parent) {
            return;
        }

        // Remove from DOM
        parent.removeChild(listItem);

        if (!stricken || stricken === "false") {
            listItem.setAttribute('data-strikethrough', true);
            listItem.classList.add('li-strikethrough');
            $$(listItem.getElementsByClassName('js-close-btn')[0]).show();
            // Add back to DOM at the bottom after modifying
            parent.appendChild(listItem);
            ListContent[list][item].Strikethrough = true;
            ListContent[list][item].Time = new Date();
        } else {
            listItem.setAttribute('data-strikethrough', false);
            listItem.classList.remove('li-strikethrough');
            $$(listItem.getElementsByClassName('js-close-btn')[0]).hide();
            // Add to top of list after input
            // There should always be [0] because the input field is there.
            parent.getElementsByTagName('li')[0].after(listItem);
            ListContent[list][item].Strikethrough = false;
            ListContent[list][item].Time = new Date();
        }
        Lists.PostList();
    }

    function GetElement(list, value) {
        item = document.querySelector('[data-list="' + list + '"][data-value="' + value + '"]')
        if (item) {
            console.log(item.parentNode.parentNode);
            return item.parentNode.parentNode;
        }
        return null;
    }
    
    /**
     * Removes the list item from the page
     * @param {HTML El} item button inside the list item to remove
     * @param {string} list May be used instead of item, must also pass in value
     * @param {string} value May be used instead of item, must also pass in list
     */
    Lists.RemoveItem = function (item, list, value) {
        // Get text content to remove from JSON
        if (item) {
            var list  = item.getAttribute('data-list');
            var value = item.getAttribute('data-value');
        } else {
            item = document.querySelector('[data-list="' + list + '"][data-value="' + value + '"]')
            if (!item) {
                // Already removed from DOM
                return;
            }
        }
        // Remove from DOM
        item.parentNode.parentNode.remove();
        // Remove from JSON
        ListContent[list][value].Removed = true;
        ListContent[list][value].Time = new Date()
        Lists.PostList();
    }

    /**
     * Initialize some buttons in the list view.
     * Called by page router in index.js
     */
    Lists.Initialize = function () {
        var listBtn      = document.getElementById('js-lists-back-btn');
        var newListInput = document.getElementById('js-list-new');
        var newListBtn   = document.getElementById('js-list-new-btn');
        if (!addedListener) {
            listBtn.addEventListener('click', function () {
                f7.mainView.router.back();
                // Erase since DOM is all removed.
                // Will restore from file when re-opened.
                Lists.SaveToFile(true);
            });

            newListBtn.addEventListener('click', function () {
                AddNewList(newListInput.value.trim());
                newListInput.value = "";
            })
            LoadFromFile();
        }
    }

    /**
     * Load lists from file
     */
    function LoadFromFile() {
        readLists(function (data) {
            MergeList(data);
            Lists.Sync();
        })
    }

    /**
     * Save lists to file
     * 
     * @param {boolean} clearData - if clearData = true, ListContent will be erased.
     */
    Lists.SaveToFile = function (clearData) {
        var dataCopy = JSON.parse(JSON.stringify(ListContent));
        saveLists(dataCopy);
        if (clearData) {
            ListContent = {};
        }
    }

    function MergeList(partnerLists) {
        // No updates, do nothing
        if (partnerLists == null) {
            return;
        }
        // Prevent calls to Add Lists from posting the list
        gSyncing = true;

        // Merge lists into local copy
        // Looping through each list
        Object.keys(partnerLists).forEach(function (list) {
            // If list doesn't exist, create it.
            if (!ListContent[list]) {
                AddNewList(list);
            }

            // Now loop through list items
            Object.keys(partnerLists[list]).forEach(function (item) {
                // If item doesn't exist, add it
                if (!ListContent[list][item]) {
                    ListContent[list][item] = partnerLists[list][item]
                    // Only really add it if the item has not been removed
                    // Now it will never exist.
                    if (!partnerLists[list][item].Removed) {
                        var strikethrough = partnerLists[list][item].Strikethrough;
                        Lists.AddListItem(list, item, strikethrough);
                        ListContent[list][item].Time = partnerLists[list][item].Time; // AddListItem updates time, but we want whatever time was saved.
                    } else {
                        // Still copy it over for now
                        // TODO: Find when it's appropriate to remove these
                        // Issue: I remove an item, so item is marked as removed
                        //        I close and open lists, Item is now gone from ListContent
                        //        I update a list, now the removed item is gone completely
                        //        Partner syncs, they don't see that the item was removed because the last list I posted didn't have the removed attribute
                        ListContent[list][item].Time = partnerLists[list][item].Time;
                    }
                } else {
                    // Item is already in DOM, need to
                    // Compare timestamps
                    var partnerTime = new Date(partnerLists[list][item].Time);
                    var localTime   = new Date(ListContent[list][item].Time);
                    if (partnerTime > localTime) {
                        ListContent[list][item] = partnerLists[list][item];
                        if (partnerLists[list][item].Strikethrough) {
                            var el = GetElement(list, item);
                            Lists.ToggleStrikethrough(el);
                        }
                        if (partnerLists[list][item].Removed) {
                            Lists.RemoveItem(null, list, item);
                        }
                    }
                    // Else, local is more recent. Wait for partner to sync
                }
            });
        });

        // Items added to DOM with strikethough attribute will have the pre-strikethrough set
        // So we need to get the element to run the actual strikethough udpate
        document.querySelectorAll('[data-pre-strikethrough=true]').forEach(function (li) {
            Lists.ToggleStrikethrough(li);
            li.setAttribute('data-pre-strikethrough', false);
        });
        gSyncing = false;
    }

    /**
     * FOR DEBUG
     */
    Lists.GetContent = function () {
        return JSON.stringify(ListContent);
    }
    
    /**
     * Pull new list items from ServerApi and merge them into local copy.
     */
    Lists.Sync = function () {
        ServerApi.GetListItems(function (data) {
            if (data) {
                MergeList(data);
            }
        });
    }

    /**
     * Posts the list to the paired device
     */
    Lists.PostList = function () {
        if (!gSyncing)
        {
            ServerApi.PostListItems(ListContent);
        }
    }

    /**
     * Function called when app is paused
     */
    Lists.onPause = function () {
        // If we're not on lists page, then lists should already have been saved.
        // But if we are on lists, then we need to save to file NOW
        if (Menu.GetPage == Menu.Pages.LISTS) {
            // Don't clear data, since if we resume, it could still be in the DOM.
            Lists.SaveToFile(false);
        }
    }
})(Lists);