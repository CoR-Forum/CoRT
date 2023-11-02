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



		});
		html += `</tr>`;
		html += `</tbody></table>`;

			$('#items').html(html);
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
				if (txtValue.toUpperCase().indexOf(filter) > -1) {
					tr[i].style.display = "";
					break;
				} else {
					tr[i].style.display = "none";
				}
			}
		}
	}
}