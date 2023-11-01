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
				html += `<tr>
				<td style="display: flex; align-items: center;text-align:center;"><img src="data/items/icons/${item.icon_url}" width="40px" style="padding-right:10px;" /> ${item.name_en}</td>`
				if (item.damage_piercing) {html += `<td><img src="data/items/icons/dmg_piercing.png" width="14px" /> ${item.damage_piercing}`};
				if (item.damage_blunt) {html += `<td><img src="data/items/icons/dmg_blunt.png" width="14px" /> ${item.damage_blunt}`};
				if (item.damage_slashing) {html += `<td><img src="data/items/icons/dmg_slashing.png" width="14px" /> ${item.damage_slashing}`};
				if (item.damage_lightning) {html += `<td><img src="data/items/icons/dmg_lightning.png" width="14px" /> ${item.damage_lightning}`};
				if (item.damage_fire) {html += `<td><img src="data/items/icons/dmg_fire.png" width="14px" /> ${item.damage_fire}`};
				if (item.damage_ice) {html += `<td><img src="data/items/icons/dmg_ice.png" width="14px" /> ${item.damage_ice}`};
				if (item.damage_bonus) {html += ` (+${item.damage_bonus})`};
				html += `</td>`;
				html += `<td>${item.range}m</td>`;
				html += `<td>${item.attack_speed}</td>`;
				html += `<td>${item.profession} ${item.level}</td>`;
				html += `<td>${item.category}</td>`;
				html += `<td>${item.weight} Kgs</td>`;


		});
		html += `</tr>`;
		html += `</tbody></table>`;

			$('#items').html(html);
		})
		.catch(error => console.error(error));
}

// q: how do I get the data from json items -> damage -> piercing? 
