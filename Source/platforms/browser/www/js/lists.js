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
 */

var Lists = {};

(function (Lists) {
    var addedListener = false;
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
            Time: JSON.stringify(new Date()) // Keep format consistent, always a string
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
     */
    Lists.AddListItem = function(list) {
        var container = document.getElementById('js-' + list);
        var inputEl   = document.getElementById('js-' + list + '-input');
        value = inputEl.value.trim();
        if (value === "") {
            return;
        }
        var listItem = `<li class="item-content" onclick="Lists.ToggleStrikethrough(this)">
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
        console.log(ListContent);
    }

    /**
     * Mark the list item as completed and moves it to the bottom of the list
     * @param {HTML Element} listItem List item to mark up
     */
    Lists.ToggleStrikethrough = function(listItem) {
        var stricken = listItem.getAttribute('data-strikethrough');
        var parent = listItem.parentNode;
        // Has list data
        var closeBtn = document.getElementsByClassName('js-close-btn')[0];
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
        } else {
            listItem.setAttribute('data-strikethrough', false);
            listItem.classList.remove('li-strikethrough');
            $$(listItem.getElementsByClassName('js-close-btn')[0]).hide();
            // Add to top of list after input
            // There should always be [0] because the input field is there.
            parent.getElementsByTagName('li')[0].after(listItem);
            ListContent[list][item].Strikethrough = false;
        }
    }
    
    /**
     * Removes the list item from the page
     * @param {HTML El} item button inside the list item to remove
     */
    Lists.RemoveItem = function (item) {
        // Get text content to remove from JSON
        var list = item.getAttribute('data-list');
        var listItem = item.getAttribute('data-value');
        // Remove from DOM
        item.parentNode.parentNode.remove();
        // Remove from JSON
        ListContent[list][listItem].Removed = true;
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
                SaveToFile();
                f7.mainView.router.back();
            });

            newListBtn.addEventListener('click', function () {
                AddNewList(newListInput.value.trim());
                newListInput.value = "";
            })
        }
        LoadFromFile();
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
     */
    function SaveToFile() {
        saveLists(ListContent);
    }

    function MergeList(partnerLists) {
        // No updates, do nothing
        if (partnerLists == null) {
            return;
        }

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
                    Lists.AddListItem(list, item);
                } else {
                    // Compare timestamps
                    var partnerTime = new Date(partnerLists[list][item].Time);
                    var localTime   = new Date(ListContent[list][item].Time);
                    if (partnerTime > localTime) {
                        ListContent[list][item] = partnerLists[list][item];
                    }
                    // Else, local is more recent. Wait for partner to sync
                }
            });
        });
    }

    /**
     * Pull new list items from server and merge them into local copy.
     */
    Lists.Sync = function () {
        Server.GetListItems(MergeList);
    }

    /**
     * Posts the list to the paired device
     */
    Lists.PostList = function () {
        Server.PostListItems(ListContent);
    }
})(Lists);