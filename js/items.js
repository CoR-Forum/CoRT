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

	refresh_display();
});


function refresh_display() {
	fetch('data/items/items.json')
		.then(response => response.json())
		.then(data => {
			let items = data.items.filter(item => item.item_category === "magnanite_weapon"); // filter items by item_type
			let html = '<tbody>';
			items.forEach(item => {
				let totalDamage = (item.damage_piercing + item.damage_bonus);
				html += `<tr><td><img src="data/items/icons/${item.icon_url}" width="40px" style="padding-right:10px;" /> </td>`;
				html += `<td style="">${item.name_en}</td>`
				if (item.damage_piercing) {html += `<td><img src="data/items/icons/dmg_piercing.png" width="14px" /> ${item.damage_piercing}`};
				if (item.damage_blunt) {html += `<td><img src="data/items/icons/dmg_blunt.png" width="14px" /> ${item.damage_blunt}`};
				if (item.damage_slashing) {html += `<td><img src="data/items/icons/dmg_slashing.png" width="14px" /> ${item.damage_slashing}`};
				if (item.damage_lightning) {html += `<td><img src="data/items/icons/dmg_lightning.png" width="14px" /> ${item.damage_lightning}`};
				if (item.damage_fire) {html += `<td><img src="data/items/icons/dmg_fire.png" width="14px" /> ${item.damage_fire}`};
				if (item.damage_ice) {html += `<td><img src="data/items/icons/dmg_ice.png" width="14px" /> ${item.damage_ice}`};
				if (item.damage_bonus) {html += ` (+${item.damage_bonus})`};
				html += `</td>`;
				html += `<td>${item.range}</td>`;
				html += `<td>${item.attack_speed}</td>`;
				html += `<td>${item.profession} (${item.level})</td>`;
				html += `<td>${item.category}</td>`;
				html += `<td>${item.weight} Kgs</td>`;
				html += `<td>`;
				if (item.bonus1) {html += `+${item.bonus1} ${item.bonus1_type_en}<br>`};
				if (item.gemsocket) {html += `${item.gemsocket} Empty Sockets`};
				html += `</td>`;
				html += `<td style="display:none">${item.item_category}</td>`;



		});
		html += `</tr>`;
		html += `</tbody></table>`;

		let html2 = '';
		items.forEach(item => {
			html2 += `<div>`;
			html2 += `<window id="item-window">
			<vbox id="main_vbox" size=expand>
				<borderbox id="name_panel" class="tooltip_panel" style="padding:5px;">
				<hbox id="main_hbox" style="padding-left:1px;">`;
				if (item.icon_url) {html2 += `
					<borderbox id="icon_panel" class="tooltip_icon_panel" style="padding:2px;">
						<img id="icon" width=32 height=32 src="data/items/icons/${item.icon_url}" />
				  	</borderbox>
				`};
			html2 += `
				<vbox id="name_vbox" style="padding:2px 0 0 0;" class="${item.class}">
					<label id="name_label" align=left richtext=true>${item.name_en}</label>
					<label id="material_and_quality_label" align=left richtext=true> of ${item.material_en} (${item.quality_en})</label>
				</vbox>
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
			if (item.uses) {html2 += `<label>Uses: ${item.uses} Kgs</label>`}
			if (item.weight) {html2 += `<label>Weight: ${item.weight} Kgs</label>`}
			if (item.itemlevel) {html2 += `<label>Item level: ${item.itemlevel}</label>`}
			if (item.profession) {html2 += `<label>Requires ${item.profession} level ${item.level}</label>`}
			if (item.description_en) {html2 += `<label style="">${item.description_en}</label>`}
			if (item.sellprice_gold) {html2 += `<label>Sell price:</label> <img width="16px" src="/data/items/icons/gold.png" /><label>${item.sellprice_gold}</label><img width="16px" src="/data/items/icons/ximerin.png" /><label>${item.sellprice_ximerin}</label>`}
			html2 += `
				  <separator id="description_separator" width=1 height=3 style="width:1px;height:3px;"></separator>
				  <wraplabel id="description_label" style="color:#C0C0C0"></wraplabel>
				  <separator id="itemmod_separator" height=3 style="height:3px;"></separator>
				`;
				if (item.bonus1) {html2 += `<label class="bonus	">+${item.bonus1} ${item.bonus1_type_en}</label>`}; 
				if (item.bonus2) {html2 += `<label class="bonus	">+${item.bonus2} ${item.bonus2_type_en}</label>`};
				if (item.bonus3) {html2 += `<label class="bonus	">+${item.bonus3} ${item.bonus3_type_en}</label>`};
				if (item.bonus4) {html2 += `<label class="bonus	">+${item.bonus4} ${item.bonus4_type_en}</label>`};
				if (item.bonus5) {html2 += `<label class="bonus	">+${item.bonus5} ${item.bonus5_type_en}</label>`};
				
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
				  if (item.class == "normal") {
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
				  <!-- label id="disabled_label" style="color:#ff0000">Roto</label -->
				</vbox>
			  </borderbox>
			</vbox>
		  </window>`;
			html2 += `</div>`;
	});

			$('#items').html(html);
			$('#item').html(html2);

		})
		.catch(error => console.error(error));
}

function searchTable(inputId, tableId) {
	// Declare variables
	var input, filter, table, tr, td, i, txtValue;
	input = document.getElementById(inputId);
	filter = input.value.toUpperCase();
	table = document.getElementById(tableId);
	tr = table.getElementsByTagName("tr");

	// Loop through all table rows, and hide those who don't match the search query
	for (i = 0; i < tr.length; i++) {
		td = tr[i].getElementsByTagName("td");
		for (var j = 0; j < td.length; j++) {
			if (td[j]) {
				txtValue = td[j].textContent || td[j].innerText;
				if (txtValue.toUpperCase().indexOf(filter.toUpperCase()) > -1) {
					tr[i].style.display = "";
					break;
				} else {
					tr[i].style.display = "none";
				}
			}
		}
	}
}

