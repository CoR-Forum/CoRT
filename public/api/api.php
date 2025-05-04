<?php
header("Access-Control-Allow-Origin: *");

$allowed_endpoints = ["warstatus", "statistics", "events"];
if (!(in_array($_GET["type"], $allowed_endpoints))) {
	http_response_code(404);
	print("HTTP 404: Invalid query");
	die();
}


header('Content-Type: application/json; charset=utf-8');
$secrets = parse_ini_file("../../warstatus/secrets.ini", true)["mysql"];
$mysqli = new mysqli($secrets["host"], $secrets["user"], $secrets["password"], $secrets["database"]);
$stmt = $mysqli->prepare("SELECT content FROM json WHERE type = ?");
$stmt->bind_param("s", $_GET["type"]);
$stmt->execute();
$result = $stmt->get_result();
print($result->fetch_assoc()["content"]);
?>
