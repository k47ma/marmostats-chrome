A Chrome extension for displaying Marmoset stats. It provides data visualization for instructor Marmoset pages.

Libraries used in this project:
- [jQuery](https://jquery.com/)
- [Chart.js](https://www.chartjs.org/)
- [University of Waterloo Open Data API](https://github.com/uwaterloo/api-documentation)

### How to Use This Tool in Chrome?

It is published to Chrome Web Store. You may [install it directly from the store page](https://chrome.google.com/webstore/detail/marmostats/gppikefopnonalmomacfjbgefkbpngfi).

If you want to install it as an unpacked package from source code. Here are some steps you can follow to load this extension:

- Clone this repository to your local machine
- Open [extensions page](chrome://extensions/) in Chrome (three vertical dots at top right > More tools > Extensions)
- Turn on **Developer Mode** at the top right corner
- Click **Load Unpacked** button at the top left corner
- Select the local folder for the repository and click "Select Folder"
- Refresh your Marmoset page and you are good to go!

### How to Update This Tool when the Repository Updates?

You don't need to worry about updates if you install the extension from Chrome Web Store.

If you installed it as an unpacked package, you will need to do some *manual update*:

- Run `git pull` on your local machine to update the local copy of this repository
- Open [extensions page](chrome://extensions/) in Chrome (three vertical dots at top right > More tools > Extensions)
- Click the **refresh** icon in this project
- Refresh your Marmoset page and you are good to go (again)!
