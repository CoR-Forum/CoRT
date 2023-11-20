let __wevents__filter = "none";
let __wevents__level = "none";

let data = null;

$(document).ready(function() {
	document.title = "CoRT - " + _("Item Index");
	$("#title").text(_("Item Index"));
	$("#name").text(_("Name"));
	$("#damage").text(_("Damage"));
	$("#range").text(_("Range"));
	$("#attack_speed").text(_("Speed"));
	$("#requires").text(_("Requires"));
	$("#category").text(_("Category"));
	$("#weight").text(_("Weight"));
	$("#bonus").text(_("Bonus"));

	$("#we-filter-label").text(_("Filter:"));
	$("#we-level-label").text(_("Level:"));
	let options = { "Global": [
				["none", _("All Items")],
				["weapon", _("Weapons")] ],
			
			"Item Category": [
				["ic:magnanite_weapon", "Magnanite Weapons"],
			],
			"Magnanite": [
				["magnanite", "All Magnanite Items"],
				["magnanite_weapon_45", "Magnanite Weapons Level 45"],
				["magnanite_weapon_55", "Magnanite Weapons Level 55"],
				["magnanite_armor", "Magnanite Armor"],
			],
			"Dragons": [
				["dragon", "All Dragon Items"],
				["dragon_jewelry", "Dragon Jewelry"],
				["dragon_50", "Dragon Items Level 50"],
				["dragon_55", "Dragon Items Level 55"],
			],
			"Bosses": [
				["boss", "All Boss Items"],
				["boss_jewelry", "Boss Jewelry"],
				["boss_50", "Boss Items Level 50"],
				["boss_55", "Boss Items Level 55"],

			],
	};
	let level = { "Common Levels": [["none","All"],["55", "55"],["60","60"]],
	};
	let options_html = "";
	for (let group in options) {
		options_html += `<optgroup label="${_(group)}">`;
		for (let o of options[group])
			options_html += `<option value="${o[0]}">${o[1]}</option>`;
		options_html += `</optgroup>`;
	}
	let level_html = "";
	for (let group in level) {
		level_html += `<optgroup label="${_(group)}">`;
		for (let o of level[group])
			level_html += `<option value="${o[0]}">${o[1]}</option>`;
		level_html += `</optgroup>`;
	}
	$("#we-level").append(level_html);
	$("#we-filter").append(options_html);
	$("#we-filter").on("change", function () {
		__wevents__filter = $("#we-filter").val();
		// display_events();
		refresh_display();
	});
	$("#we-level").on("change", function () {
		__wevents__filter = $("#we-level").val();
		// display_events();
		refresh_display();
	});
	refresh_display();
	let urlsearch = new URLSearchParams(window.location.search);
	let filter = urlsearch.get("f");
	if (!filter) {
		$("#we-filter").val("none");
		refresh_display();
	}
	else {
		console.log("filter found");
		$("#we-filter").val(filter);
		$("#we-filter").trigger("change");
	}
});



function refresh_display() {
	fetch('data/items/items.json')
		.then(response => response.json())
		
		.then(data => {
			if (__wevents__filter == "none") {
				items = data.items;
			} else if (__wevents__filter == "weapon") {
				items = data.items.filter(item => item.item_type == "weapon");
			}
			else if (__wevents__filter.startsWith("ic:")) {
				let item_category = __wevents__filter.split(":")[1];
				items = data.items.filter(item => item.item_category == item_category);
			}
			else if (__wevents__filter.startsWith("r:")) {
				let rarity = __wevents__filter.split(":")[1];
				items = data.items.filter(item => item.class == rarity);
			}
			else if (__wevents__filter == "magnanite") {
			items = data.items.filter(item => item.item_category.startsWith("magnanite"));
			}
			else if (__wevents__filter == "magnanite_weapon_45") {
				items = data.items.filter(item => item.item_category.startsWith("magnanite") && item.level == 45);
			}
			else if (__wevents__filter == "magnanite_weapon_55") {
				items = data.items.filter(item => item.item_category.startsWith("magnanite") && item.level == 55);
			}
			else if (__wevents__filter == "magnanite_armor") {
				items = data.items.filter(item => item.item_category == "magnanite_armor");
			}
			else if (__wevents__filter == "dragon") {
			items = data.items.filter(item => item.item_category.startsWith("dragon"));
			}
			else if (__wevents__filter == "dragon_jewelry") {
				items = data.items.filter(item => item.item_category.startsWith("dragon_jewelry"));
				}
			else if (__wevents__filter == "dragon_50") {
				items = data.items.filter(item => item.item_category.startsWith("dragon") && item.level == 50);
			}
			else if (__wevents__filter == "dragon_55") {
				items = data.items.filter(item => item.item_category.startsWith("dragon") && item.level == 55);
			}
			else if (__wevents__filter == "boss") {
				items = data.items.filter(item => item.item_category.startsWith("boss"));
			}
			else if (__wevents__filter == "boss_jewelry") {
				items = data.items.filter(item => item.item_category.startsWith("boss_jewelry"));
			}
			else if (__wevents__filter == "boss_50") {
				items = data.items.filter(item => item.item_category.startsWith("boss") && item.level == 50);
			}
			else if (__wevents__filter == "boss_55") {
				items = data.items.filter(item => item.item_category.startsWith("boss") && item.level == 55);
			}

			if (__wevents__level) {
				items = items.filter(item => item.level <= __wevents__level);
			}


			



		let html2 = '';
		items.forEach(item => {
			if (item.category == "long") {
				item.category = "Long Bow";
			}
			if (item.category == "short") {
				item.category = "Short Bow";
			}
			if (item.category == "staff") {
				item.category = "Staff";
			}
			if (item.category == "axe") {
				item.category = "Axe";
			}
			if (item.category == "sword") {
				item.category = "Sword";
			}
			if (item.category == "spear") {
				item.category = "Spear";
			}
			if (item.category == "misc") {
				item.category = "Misc";
			}
			if (item.attack_speed == "slow") {
				item.attack_speed = "Slow";
			}
			if (item.attack_speed == "med") {
				item.attack_speed = "Medium";
			}
			if (item.attack_speed == "fast") {
				item.attack_speed = "Fast";
			}
			if (item.attack_speed == "very_fast") {
				item.attack_speed = "Very Fast";
			}
			if (item.attack_speed == "very_slow") {
				item.attack_speed = "Very Slow";
			}

			if (item.display_image) {
				html2 += `<img src="data/items/displays/${item.display_image}" />`;
			} else {

			html2 += `<div id="item" class="item">`;
			html2 += `<window id="item-window">`;

			html2 += `<vbox id="main_vbox" size=expand>
				<borderbox id="name_panel" class="tooltip_panel" style="padding:5px;">
				<hbox id="main_hbox" style="padding-left:1px;">`;
				if (item.icon_url) {html2 += `
					<borderbox id="icon_panel" class="tooltip_icon_panel" style="padding:2px;">
						<img id="icon" width=32 height=32 src="data/items/icons/${item.icon_url}" />
				  	</borderbox>
				`}
			html2 += `
				<vbox id="name_vbox" style="padding:2px 0 0 0;">
					<label class="${item.class}" align=left>${item.name_en}</label>`;
				if (item.material_en || item.quality_en) {
			html2 += `		<label class="${item.class}" align=left> of ${item.material_en} (${item.quality_en})</label>`;}

			html2 +=`	</vbox>
				</hbox>
			  	</borderbox>
				<separator id="separator1" width=1 height=1 style="width:1px;height:1px;"></separator>
			  	<borderbox id="data_panel" class="tooltip_panel" style="padding:7px 5px 5px 5px;">
				<vbox id="data_vbox">`;
				
				if (item.damage_bonus){
					html2 += `<label style='color:#FFFF80'>Damage (+${item.damage_bonus}):</label>`;
				} else if (item.damage_slashing || item.damage_piercing || item.damage_blunt || item.damage_fire || item.damage_ice || item.damage_lightning) {
					html2 += `<label style='color:#FFFF80'>Damage:</label>`;
				} else { }
				html2 += `<hbox id="damage_hbox">`;
				if (item.damage_slashing) {html2 += `<img src="/data/items/icons/dmg_slashing.png" width=16 height=16 /> <label style="color:#FFFF80">${item.damage_slashing}</label>`}
				if (item.damage_piercing) {html2 += `<img src="/data/items/icons/dmg_piercing.png" width=16 height=16 /> <label style="color:#FFFF80">${item.damage_piercing}</label>`}
				if (item.damage_blunt) {html2 += `<img src="/data/items/icons/dmg_blunt.png" width=16 height=16 /> <label style="color:#FFFF80">${item.damage_blunt}</label>`}
				if (item.damage_fire) {html2 += `<img src="/data/items/icons/dmg_fire.png" width=16 height=16 /> <label style="color:#FFFF80">${item.damage_fire}</label>`}
				if (item.damage_ice) {html2 += `<img src="/data/items/icons/dmg_ice.png" width=16 height=16 /> <label style="color:#FFFF80">${item.damage_ice}</label>`}
				if (item.damage_lightning) {html2 += `<img src="/data/items/icons/dmg_lightning.png" width=16 height=16 /> <label style="color:#FFFF80">${item.damage_lightning}</label>`}
				html2 += `
			  </hbox>`;
			  if (item.protection_bonus){
				html2 += `<label style="color:#FFFF80">Armor: ${item.protection} (+${item.protection_bonus})</label>`;
			} else if (item.protection) {
				html2 += `<label style="color:#FFFF80">Armor: ${item.protection}</label>`;
			} else { }

			if (item.protection_slashing) {html2 += `<hbox><img src="/data/items/icons/dmg_slashing.png" width=16 height=19 /><label style="color:#FFFF80">${item.protection_slashing}</label></hbox>`}
			if (item.protection_piercing) {html2 += `<hbox><img src="/data/items/icons/dmg_piercing.png" width=16 height=19 /><label style="color:#FFFF80">${item.protection_piercing}</label></hbox>`}
			if (item.protection_blunt) {html2 += `<hbox><img src="/data/items/icons/dmg_blunt.png" width=16 height=19 /><label style="color:#FFFF80">${item.protection_blunt}</label></hbox>`}
			if (item.protection_fire) {html2 += `<hbox><img src="/data/items/icons/dmg_fire.png" width=16 height=19 /><label style="color:#FFFF80">${item.protection_fire}</label></hbox>`}
			if (item.protection_ice) {html2 += `<hbox><img src="/data/items/icons/dmg_ice.png" width=16 height=19 /><label style="color:#FFFF80">${item.protection_ice}</label></hbox>`}
			if (item.protection_lightning) {html2 += `<hbox><img src="/data/items/icons/dmg_lightning.png" width=16 height=19 /><label style="color:#FFFF80">${item.protection_lightning}</label></hbox>`}
			html2 += `<separator id="separator2" width=1 height=3 style="width:1px;height:3px;"></separator>`;
			if (item.category) {html2 += `<label>Category: ${item.category}</label>`}
			if (item.attack_speed) {html2 += `<label>Attack speed: ${item.attack_speed}</label>`}
			if (item.range) {html2 += `<label>Range: ${item.range}</label>`}
			if (item.durability) {html2 += `<label>Durability: ${item.durability}/${item.durability}</label>`}
			if (item.quantity) {html2 += `<label>Quantity: ${item.quantity}</label>`}
			if (item.uses) {html2 += `<label>Uses: ${item.uses}</label>`}
			if (item.weight) {html2 += `<label>Weight: ${item.weight} Kgs</label>`}
			if (item.itemlevel) {html2 += `<label class="itemlevel">Item level ${item.itemlevel}</label>`}
			if (item.profession) {html2 += `<label>Requires ${item.profession} Level ${item.level}</label>`}
			if (item.description_en) {html2 += `<label class="description">${item.description_en}</label>`}
			if (item.sellprice_gold) {html2 += `<label>Sell price: <img width="16px" src="/data/items/icons/gold.png" /> ${item.sellprice_gold}<img width="16px" src="/data/items/icons/ximerin.png" />${item.sellprice_ximerin}</label>`}
			html2 += `
				  <separator id="description_separator" width=1 height=3 style="width:1px;height:3px;"></separator>
				  <wraplabel id="description_label" style="color:#C0C0C0"></wraplabel>
				  <separator id="itemmod_separator" height=3 style="height:3px;"></separator>
				`;
				if (item.bonus1) {html2 += `<label class="bonus">+${item.bonus1} ${item.bonus1_type_en}</label>`}; 
				if (item.bonus2) {html2 += `<label class="bonus">+${item.bonus2} ${item.bonus2_type_en}</label>`};
				if (item.bonus3) {html2 += `<label class="bonus">+${item.bonus3} ${item.bonus3_type_en}</label>`};
				if (item.bonus4) {html2 += `<label class="bonus">+${item.bonus4} ${item.bonus4_type_en}</label>`};
				if (item.bonus5) {html2 += `<label class="bonus">+${item.bonus5} ${item.bonus5_type_en}</label>`};
				
				if (item.gemsocket) {
					for (let i = 0; i < item.gemsocket; i++) {
						html2 += `<label style="color: #6B6B6B">Empty Socket</label>`;
					}
				}


				html2 += `
				  <!-- <separator id="kindmod_separator" height=3 style="height:3px;"></separator> -->
				  <!-- <repeat start=1 end=5> -->
				  <!-- <label id="kindmod_label#"></label> -->
				  <!-- </repeat> -->
				  <!-- <separator id="socketmod_separator" height=3 style="height:3px;"></separator> -->
				  <!-- <repeat start=1 end=7> -->

	  
				  <separator width=6 style="width:6px;"></separator>
				  </hbox>
				  <!-- </repeat> -->
				  <separator id="kind_separator" width=1 height=3 style="width:1px;height:3px;"></separator>
				  <!-- below is the blue progress bar, which isn't implemented but we will keep it here for the future. styling is unknown -->
				  <!-- progressbar id="minutes_left_bar" class="time_bar" height=1></progressbar -->
				  `;
				  // if item class is normal, hide the class
				  
				  if (item.class === "normal" || item.class === "premium") {
				}
				  // otherwise show the class
				  else {
					html2 += `<label class="${item.class}">${item.class}</label>`;
				  };
				  if (item.bound_char) {html2 += `<label style="color:#984F33">Bound to Character</label>`};
				  if (item.bound_acc) {html2 += `<label style="color:#984F33">Bound to Account</label>`};
				  html2 += `
				  <!-- label id="bound_to_account" show="false"></label -->
				  <!-- below is a red label, it's use is unknown -->
				  <!-- label id="disabled_label" style="color:#ff0000">Roto</label -->`

			html2 +=`				</vbox>
			  </borderbox>
			</vbox>
		  </window>`;
		  if (item.stub){html2 += `<window><vbox><borderbox class="tooltip_panel" style="padding:7px 5px 5px 5px;"><label style="color:#ff0000">Data of this item might be wrong or incomplete,<br>you can help us by <a href="#">expanding the data source</a>.</label>`};
		  if (item.na){html2 += `<window><vbox><borderbox class="tooltip_panel" style="padding:7px 5px 5px 5px;"><label style="color:#6B6B6B">This item is not available,<br>but it's existance has been profen.<br>Source: ${item.na_source}</label>`};

			html2 += `</div>`;
		}});

			$('#items-index').html(html2);

		})
		.catch(error => console.error(error));
}

