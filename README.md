# Champions of Regnum trainer (and more)

Since the famous regnumsentinel trainer is dead, all is left are operating
systems locked trainers, or the updated Inquisition trainer from the german
Regnum forum *(update: they ended up using this trainer instead)* but it has
some outdated mechanics.

This is a (simpler) knockoff of the regnumsentinel website trainer, this one
will be alive as long as GitHub exists and is open source software. On top of
that, there are countdown pages for bosses and BZ, WZ status and statistics.

The website just requires a webserver serving static files to run, everything
is run client side, with the exception of the WZ status and statistics (see the
`warstatus` directory) that can partly be replaced by a link to NGE's official
page, and anonymous setup collection (see the `collect` directory) which by
default only works for https://mascaldotfr.github.io and can be completely
skipped.

## Known issues

* ~display on mobile devices is weird due to flex in the WM skill row. it's not
  easy to fix, as even regnumsentinel had the issue. Use your device in
  landscape mode if it really bothers you.~ *This is fixed on most devices.*
* shared urls are long, this could be fixed by using an url shortener api, but
  free plans may be quickly limit rated and they're not permanent. I don't want
  to have a database server, since it then would require a separate server and
  a domain for such a feature, that could go down like regnumsentinel.

## Setting a local webserver

If you want to make changes to CoRT or run it locally, you can use python to
[create a temporary local webserver](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/set_up_a_local_testing_server#using_python).

## License

   This repo is released under the terms of the GNU Affero General Public
   License v3.0. The discipline/skill icons are the work of Nimble Giant
   Entertainement, and are used as fair use.

   Some parts of the site are MIT licensed as exceptions, please see their
   header files.

   [Chartist](https://github.com/chartist-js/chartist) is dual licensed under
   MIT/WTFPL licenses terms. A local copy has been taken from
   [UNPKG](https://unpkg.com/browse/chartist@1.3.0/dist/).

## Contributing

If you plan to bring code improvements:

0. The site should be *usable* despite obvious visual glitches with [Firefox 60](#why-using-firefox-60-as-a-baseline),
   and is expected to look as intended in the latest stable versions of major
   browsers (Chrome, Firefox, Edge, Safari, and on mobile as well). Keep that
   in mind for the frontend. At least check at https://caniuse.com/ .
1. Keep things simple; simple code may be slower but given the simplicity of
   the proposed tools there is no bottleneck, and i don't want them when
   maintaining.
2. Keep the style consistent, even if sometimes it's gross like not using dot
   notation for hashes.
3. The javascript used in CoRT must follow ECMAScript <= 8, please use
   [JSHint](https://jshint.com/) to check this out, or mention
   you didn't. Linux usage:
   ```shell
   cd /tmp
   npm install jshint
   cd node_modules/jshint
   echo '{ "esversion"     : 8 }' > jshintrc
   ./jshint -c jshintrc /where/is/CoRT/js/*.js | grep esversion
   # Should return nothing
   ```
4. If you touch the python code, try to not adding extra modules as a dependency.

### Why using Firefox 60 as a baseline

The oldest browser a valid bug was reported against was Chrome 80
(`element.replaceChildren()` missing), so we've mostly up to date users, thanks
to browser updating themselves. But the baseline is born from it.

Actually the site works even with Firefox 52 (XP/Vista), minus the charts. As
such, Firefox 60 (May 2018) was chosen because it was the closest ESR version
to 52 supporting the charts, and any bug report for a browser older than that
will be rejected.

You can use an old [Debian Live image which has already that version
preloaded](https://cdimage.debian.org/cdimage/archive/9.7.0-live/amd64/iso-hybrid/debian-live-9.7.0-amd64-xfce.iso)
in a virtual machine to test.

Note that this requirement will change over time, for example if TLS technology
changes and makes this version unable to connect to https sites.

## Credits

* [Xia](https://github.com/xia) and Edward "[urkle](https://github.com/urkle)"
  Rudd, who wrote the first Inquisition trainer.
  [Anpu](https://github.com/Anpu) did a thing or two about it as well iirc.
* [Joshua2504](https://github.com/Joshua2504) and
  [Shaiko](https://github.com/Shaiko35) from https://cor-forum.de/ for keeping
  the spell database updated
* Slartibartfast, the regnumsentinel.com creator, site that gave me big hints about
  the UI should be done.
