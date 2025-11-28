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
	float shininess;
	vec3 specular_color;
};

layout (binding = 2) uniform sampler2D albedo_tex;
layout (binding = 3) uniform sampler2D specular_tex;
layout (binding = 4) uniform sampler2D emissive_tex;

vec4 sampleNonTrivial(sampler2D tex, vec2 uv) {
	vec2 uv1 = uv + vec2(sin(uv.y * 10.0) * 0.01, cos(uv.x * 10.0) * 0.01);
	vec2 uv2 = uv * 2.0;
	vec4 s1 = texture(tex, uv1);
	vec4 s2 = texture(tex, uv2);
	return mix(s1, s2, 0.3);
}

void main() {
	vec3 normal = normalize(f_normal);
	vec3 view_dir = normalize(camera_position - f_position);
	
	vec4 albedo_sample = sampleNonTrivial(albedo_tex, f_uv);
	vec3 albedo = albedo_sample.rgb * albedo_color;
	vec3 specular_map = texture(specular_tex, f_uv).rgb;
	vec3 emissive = texture(emissive_tex, f_uv).rgb;
	
	vec3 result = ambient_light * albedo + emissive;
	
	// точечный
	vec3 light_dir = normalize(point_pos - f_position);
	float diff = max(dot(normal, light_dir), 0.0);
	float distance = length(point_pos - f_position);
	float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
	vec3 reflect_dir = reflect(-light_dir, normal);
	float spec = pow(max(dot(view_dir, reflect_dir), 0.0), shininess);
	result += (diff * albedo + spec * specular_map * specular_color) * point_color * attenuation;
	
	// направленный
	light_dir = normalize(-dir_dir);
	diff = max(dot(normal, light_dir), 0.0);
	reflect_dir = reflect(-light_dir, normal);
	spec = pow(max(dot(view_dir, reflect_dir), 0.0), shininess);
	result += (diff * albedo + spec * specular_map * specular_color) * dir_color;
	
	// прожекторный
	light_dir = normalize(spot_pos - f_position);
	float theta = dot(light_dir, normalize(spot_dir));
	float outer_cutoff = cos(acos(spot_cutoff) + radians(5.0));
	float epsilon = spot_cutoff - outer_cutoff;
	float intensity = clamp((theta - outer_cutoff) / epsilon, 0.0, 1.0);
	diff = max(dot(normal, light_dir), 0.0);
	distance = length(spot_pos - f_position);
	attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
	reflect_dir = reflect(-light_dir, normal);
	spec = pow(max(dot(view_dir, reflect_dir), 0.0), shininess);
	result += (diff * albedo + spec * specular_map * specular_color) * spot_color * attenuation * intensity;
	
	final_color = vec4(result, 1.0);
}
