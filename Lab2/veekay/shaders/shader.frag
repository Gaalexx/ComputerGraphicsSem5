#version 450

layout (location = 0) in vec3 f_position;
layout (location = 1) in vec3 f_normal;
layout (location = 2) in vec2 f_uv;

layout (location = 0) out vec4 final_color;

layout (binding = 0, std140) uniform SceneUniforms {
	mat4 view_projection;
	vec3 camera_position; float _pad0;
	vec3 ambient_light; float _pad1;
	vec3 point_pos; float _pad2;
	vec3 point_color; float _pad3;
	vec3 dir_dir; float _pad4;
	vec3 dir_color; float _pad5;
	vec3 spot_pos; float _pad6;
	vec3 spot_dir; float _pad7;
	vec3 spot_color; float spot_cutoff;
};

layout (binding = 1, std140) uniform ModelUniforms {
	mat4 model;
	vec3 albedo_color;
};

void main() {
	vec3 normal = normalize(f_normal);
	vec3 view_dir = normalize(camera_position - f_position);
	vec3 result = ambient_light * albedo_color;
	
	// Point light
	vec3 light_dir = normalize(point_pos - f_position);
	float diff = max(dot(normal, light_dir), 0.0);
	float distance = length(point_pos - f_position);
	float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
	result += (diff + pow(max(dot(view_dir, reflect(-light_dir, normal)), 0.0), 32.0)) * point_color * attenuation * albedo_color;
	
	// Directional light
	light_dir = normalize(-dir_dir);
	diff = max(dot(normal, light_dir), 0.0);
	result += (diff + pow(max(dot(view_dir, reflect(-light_dir, normal)), 0.0), 32.0)) * dir_color * albedo_color;
	
	// Spot light
	light_dir = normalize(spot_pos - f_position);
	float theta = dot(light_dir, normalize(spot_dir));
	float outer_cutoff = cos(radians(acos(spot_cutoff) * 180.0 / 3.14159 + 5.0));
	float epsilon = spot_cutoff - outer_cutoff;
	float intensity = clamp((theta - outer_cutoff) / epsilon, 0.0, 1.0);
	diff = max(dot(normal, light_dir), 0.0);
	distance = length(spot_pos - f_position);
	attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
	result += (diff + pow(max(dot(view_dir, reflect(-light_dir, normal)), 0.0), 32.0)) * spot_color * attenuation * intensity * albedo_color;
	
	final_color = vec4(result, 1.0);
}
