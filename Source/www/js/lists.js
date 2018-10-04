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
 *      Removed - bool - indicates the whole list has been removed
 *      Timestamp - date - indicates when the list was removed
 *   Format:
 *      [Name] = Items
 *      
 * 
 * Object ListItem:
 *   Properties:
 *      Text - String - Text for list item
 *      Strikethrough - bool - determine if item has a strikethrough in it
 *      Removed - bool - determine if item has been deleted from the list
 *      Time - Date String - last updated timestamp, turn into Date object with new Date(string)
 *   Format:
 *      [Text] = {Strikethrough: boolean, Removed: boolean, Time: Date} }
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
        ListContent[name] = {
            items: {},
            Time: new Date(),
            Removed: false
        };
        Lists.PostList();
    }

    /**
     * ListItem Class, see file header for details
     * @param {string} name - Name of the list
     * @param {string} text - text for list item
     */
    function CreateListItem(list, text) {
        ListContent[list]['items'][text] = {
            Strikethrough: false,
            Removed: false,
            Time: new Date()
        }
        console.log("Updated list items")
        console.log(JSON.stringify(ListContent));
    }

    /**
     * Removes list from from ListContent
     * 
     * @param {num} id id for the list to remove, title will be looked up
     * @param {string} id list title
     */
    function RemoveList(id) {
        if (typeof(id) === "number") {
            var title = GetListTitle(id);
            ListContent[title].Removed = true;
            ListContent[title].Time = new Date();
            document.getElementById('js-list-' + id).remove();
            Lists.PostList();
        } else if (typeof(id) === "string") {
            ListContent[id].Removed = true;
            ListContent[id].Time = new Date();
            document.querySelector('[data-title=' + id + ']').remove();
            Lists.PostList();
        }
    }

    /**
     * Retrieves the list title based on the id
     * 
     * @param {num} id id for the list
     */
    function GetListTitle(id) {
        return document.getElementById('js-list-' + id).getElementsByClassName('item-title')[0].textContent;
    }

    /**
     * Adds the taphold listener to open a dialog to remve the list
     * 
     * @param {num} id id for the li element
     */
    function AddTapholdListener(id) {
        setTimeout(function () {
            $$('#js-list-' + id).on('taphold', function () {
                var title = GetListTitle(id);
                f7.dialog.prompt("Would you like to remove `" + title + "`?",
                                 "Remove list?",
                                 function () {
                                    RemoveList(id);
                                 });
            });
        })
    }

    /**
     * Add a new list to the page
     * @param {string} name Name of the new list
     */
    var gListId = 0;
    function AddNewList(name) {
        name = name.trim()
        if (name === "") {
            return;
        }
        var listContainer = document.getElementById('js-list-container');
        var listHtml = `<li data-title="`+name+`" class="accordion-item" id="js-list-`+ gListId +`">
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
                                                <input id="js-` + name + `-input" type="text" name="text" placeholder="New Item">
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
        AddTapholdListener(gListId++);
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
        var value = inputEl.value.trim();
        if (value === "") {
            if (val == null) {
                return;
            } else {
                value = val;
            }
        }
        var listItem = `<li class="item-content `+(strikethrough ? "li-strikethrough" : "")+`" onclick="Lists.ToggleStrikethrough(this)" data-strikethrough="`+ (strikethrough ? "true" : "false") +`">
                            <div class="item-inner">
                                <div class="item-title">
                                    ` + value + `
                                </div>
                                <div data-list="`+list+`" data-value="`+value+`" class="item-after js-close-btn" style="` + (strikethrough ? "": "display: none;") + `" onclick="Lists.RemoveItem(this)">
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
            ListContent[list]['items'][item].Strikethrough = true;
            ListContent[list]['items'][item].Time = new Date();
        } else {
            listItem.setAttribute('data-strikethrough', false);
            listItem.classList.remove('li-strikethrough');
            $$(listItem.getElementsByClassName('js-close-btn')[0]).hide();
            // Add to top of list after input
            // There should always be [0] because the input field is there.
            var li = parent.getElementsByTagName('li')[0];
            li.parentNode.insertBefore(listItem, li.nextSibling);
            ListContent[list]['items'][item].Strikethrough = false;
            ListContent[list]['items'][item].Time = new Date();
        }
        Lists.PostList();
    }

    function GetElement(list, value) {
        item = document.querySelector('[data-list="' + list + '"][data-value="' + value + '"]')
        if (item) {
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
        ListContent[list]['items'][value].Removed = true;
        ListContent[list]['items'][value].Time = new Date();
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
        console.log("Start looking here");
        console.log(JSON.stringify(ListContent));
        console.log(JSON.stringify(partnerLists));
        // Merge lists into local copy
        // Looping through each list
        Object.keys(partnerLists).forEach(function (list) {
            if (ListContent[list]) {
                // List exists locally. Compare times
                var lTime = new Date(ListContent[list].Time);
                var pTime = new Date(partnerLists[list].Time);
                if (lTime < pTime) {
                    // Partner time is more recent. Use theirs
                    if (partnerLists[list].Removed) {
                        RemoveList(list);
                        ListContent[list].Time = partnerLists[list].Time;
                    }
                    // If not removed, nothing else to do here.
                }
            }
            // If the list does not exist locally and it has not been removed
            // then add it
            if (!ListContent[list] && !partnerLists[list].Removed) {
                AddNewList(list);
                ListContent[list].Time = partnerLists[list].Time;
            } else if (!ListContent[list] && partnerLists[list].Removed) {
                // Stay in sync even if it's been removed.
                // but don't add to DOM
                ListContent[list] = partnerLists[list];
            }

            // Now loop through list items
            Object.keys(partnerLists[list]['items']).forEach(function (item) {
                // If item doesn't exist, add it
                if (!ListContent[list]['items'][item]) {
                    // Still copy it over for now
                    // TODO: Find when it's appropriate to remove these
                    // Issue: I remove an item, so item is marked as removed
                    //        I close and open lists, Item is now gone from ListContent
                    //        I update a list, now the removed item is gone completely
                    //        Partner syncs, they don't see that the item was removed because the last list I posted didn't have the removed attribute
                    // Only really add it if the item has not been removed
                    // Now it will never exist.
                    console.log(JSON.stringify(partnerLists[list]['items'][item]))
                    console.log(JSON.stringify(partnerLists[list]['items']));
                    console.log("Failed on list: " + list + " and item: " + item);
                    if (!partnerLists[list]['items'][item].Removed) {
                        var strikethrough = partnerLists[list]['items'][item].Strikethrough;
                        Lists.AddListItem(list, item, strikethrough);
                    }
                    ListContent[list]['items'][item] = partnerLists[list]['items'][item]
                    // alert("Adding Item: " + list + " Item: " + item + "\n" +
                    //       "Partner: " + JSON.stringify(partnerLists[list][item]) +
                    //       "Local:   " + JSON.stringify(ListContent[list][item]));
                } else {
                    // alert("Modifying: " + list + " Item: " + item + "\n" +
                    //       "Partner: " + JSON.stringify(partnerLists[list][item]) + "\n" +
                    //       "Local:   " + JSON.stringify(ListContent[list][item]));
                    // Item is already in DOM, need to
                    // Compare timestamps
                    var partnerTime = new Date(partnerLists[list]['items'][item].Time);
                    var localTime   = new Date(ListContent[list]['items'][item].Time);
                    if (partnerTime > localTime) {
                        
                        if (partnerLists[list]['items'][item].Removed != ListContent[list]['items'][item].Removed) {
                            if (partnerLists[list]['items'][item].Removed) {
                                Lists.RemoveItem(null, list, item);
                            } else {
                                Lists.AddListItem(list, item);
                            }
                        }
                        
                        if (!ListContent[list]['items'][item].Removed && (ListContent[list]['items'][item].Strikethrough != partnerLists[list]['items'][item].Strikethrough)) {
                            var el = GetElement(list, item);
                            Lists.ToggleStrikethrough(el);
                        }
                        // After updating, set object to partner's since above operations
                        // may modify timestamp (and other potential properties)
                        ListContent[list]['items'][item] = partnerLists[list]['items'][item];
                    } else {
                        // alert("Not modifying List: " + list + " Item: " + item + "\n" +
                        //       "Partner: " + JSON.stringify(partnerLists[list][item]) + "\n" +
                        //       "Local:   " + JSON.stringify(ListContent[list][item]));
                    }
                    // Else, local is more recent. Wait for partner to sync
                }
            });
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