# ox-camunda-email-workflows
Use this plugin to be able to start OX-related Camunda Workflows from within an Email

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 2.0 Generic License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/2.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.

**Install:**
* **Copy all files to some debian/ubuntu distribution**; in a folder 'ox-camunda-email-workflows'
* If not installed: install npm (nodejs), [grunt](http://oxpedia.org/wiki/index.php?title=AppSuite:GettingStartedWithGrunt#Node) and yo ([instruction](http://oxpedia.org/wiki/index.php?title=AppSuite:GettingStarted_7.6.0))
* **Create debian package** ([ox instruction](http://oxpedia.org/wiki/index.php?title=AppSuite:GettingStarted_7.6.0#DEB_packages))
* **Copy new .deb file to productive system**. (e.g. ~/ox/ox-camunda-email-workflows/)
* If not installed: install dpkg. `sudo apt-get install dpkg`
* **Install new debian package**: `sudo dpkg -i ~/ox/ox-camunda-email-workflows/packagefile.deb`

Known issues:
* If memory overflow while install: restart the system/virtual machine and try again.

**Config:**
* Open .../ox-camunda-email-workflows/apps/de.iisys.ox.camunda-email-workflows/**register.js**
* Change `var CAMUNDA_URL` to the right url.