
var enums = {
    /**
     * @enum pc.BLEND
     * @name pc.BLEND_SUBTRACTIVE
     * @description Subtract the color of the source fragment from the destination fragment
     * and write the result to the frame buffer.
     */
    BLEND_SUBTRACTIVE: 0,
    /**
     * @enum pc.BLEND
     * @name pc.BLEND_ADDITIVE
     * @description Add the color of the source fragment to the destination fragment
     * and write the result to the frame buffer.
     */
    BLEND_ADDITIVE: 1,
    /**
     * @enum pc.BLEND
     * @name pc.BLEND_NORMAL
     * @description Enable simple translucency for materials such as glass. This is
     * equivalent to enabling a source blend mode of pc.BLENDMODE_SRC_ALPHA and a destination
     * blend mode of pc.BLENDMODE_ONE_MINUS_SRC_ALPHA.
     */
    BLEND_NORMAL: 2,
    /**
     * @enum pc.BLEND
     * @name pc.BLEND_NONE
     * @description Disable blending.
     */
    BLEND_NONE: 3,
    /**
     * @enum pc.BLEND
     * @name pc.BLEND_PREMULTIPLIED
     * @description Similar to pc.BLEND_NORMAL expect the source fragment is assumed to have
     * already been multiplied by the source alpha value.
     */
    BLEND_PREMULTIPLIED: 4,
    /**
     * @enum pc.BLEND
     * @name pc.BLEND_MULTIPLICATIVE
     * @description Multiply the color of the source fragment by the color of the destination
     * fragment and write the result to the frame buffer.
     */
    BLEND_MULTIPLICATIVE: 5,
    /**
     * @enum pc.BLEND
     * @name pc.BLEND_ADDITIVEALPHA
     * @description Same as pc.BLEND_ADDITIVE except the source RGB is multiplied by the source alpha.
     */
    BLEND_ADDITIVEALPHA: 6,

    /**
     * @enum pc.BLEND
     * @name pc.BLEND_MULTIPLICATIVE2X
     * @description Multiplies colors and doubles the result
     */
    BLEND_MULTIPLICATIVE2X: 7,

    /**
     * @enum pc.BLEND
     * @name pc.BLEND_SCREEN
     * @description Softer version of additive
     */
    BLEND_SCREEN: 8,

    /**
     * @enum pc.FOG
     * @name pc.FOG_NONE
     * @description No fog is applied to the scene.
     */
    FOG_NONE: 'none',
    /**
     * @enum pc.FOG
     * @name pc.FOG_LINEAR
     * @description Fog rises linearly from zero to 1 between a start and end depth.
     */
    FOG_LINEAR: 'linear',
    /**
     * @enum pc.FOG
     * @name pc.FOG_EXP
     * @description Fog rises according to an exponential curve controlled by a density value.
     */
    FOG_EXP: 'exp',
    /**
     * @enum pc.FOG
     * @name pc.FOG_EXP2
     * @description Fog rises according to an exponential curve controlled by a density value.
     */
    FOG_EXP2: 'exp2',

    FRESNEL_NONE: 0,
    FRESNEL_SCHLICK: 2,

    LAYER_HUD: 0,
    LAYER_GIZMO: 1,
    LAYER_FX: 2,
    LAYER_WORLD: 3,

    /**
     * @enum pc.LIGHTTYPE
     * @name pc.LIGHTTYPE_DIRECTIONAL
     * @description Directional (global) light source.
     */
    LIGHTTYPE_DIRECTIONAL: 0,
    /**
     * @enum pc.LIGHTTYPE
     * @name pc.LIGHTTYPE_POINT
     * @description Point (local) light source.
     */
    LIGHTTYPE_POINT: 1,
    /**
     * @enum pc.LIGHTTYPE
     * @name pc.LIGHTTYPE_SPOT
     * @description Spot (local) light source.
     */
    LIGHTTYPE_SPOT: 2,

    LIGHTFALLOFF_LINEAR: 0,
    LIGHTFALLOFF_INVERSESQUARED: 1,

    SHADOW_DEPTH: 0,
    SHADOW_DEPTHMASK: 1,

    SHADOWSAMPLE_HARD: 0,
    SHADOWSAMPLE_PCF3X3: 1,
    SHADOWSAMPLE_MASK: 2,

    PARTICLESORT_NONE: 0,
    PARTICLESORT_DISTANCE: 1,
    PARTICLESORT_NEWER_FIRST: 2,
    PARTICLESORT_OLDER_FIRST: 3,
    PARTICLEMODE_GPU: 0,
    PARTICLEMODE_CPU: 1,
    EMITTERSHAPE_BOX: 0,
    EMITTERSHAPE_SPHERE: 1,

    /**
     * @enum pc.PROJECTION
     * @name pc.PROJECTION_PERSPECTIVE
     * @description A perspective camera projection where the frustum shape is essentially pyrimidal.
     */
    PROJECTION_PERSPECTIVE: 0,
    /**
     * @enum pc.PROJECTION
     * @name pc.PROJECTION_ORTHOGRAPHIC
     * @description An orthographic camera projection where the frustum shape is essentially a cuboid.
     */
    PROJECTION_ORTHOGRAPHIC: 1,

    RENDERSTYLE_SOLID: 0,
    RENDERSTYLE_WIREFRAME: 1,
    RENDERSTYLE_POINTS: 2,

    CUBEPROJ_NONE: 0,
    CUBEPROJ_BOX: 1,

    SPECULAR_PHONG: 0,
    SPECULAR_BLINN: 1,

    GAMMA_NONE: 0,
    GAMMA_SRGB: 1,
    GAMMA_SRGBFAST: 2,

    TONEMAP_LINEAR: 0,
    TONEMAP_FILMIC: 1,

    SPECOCC_NONE: 0,
    SPECOCC_AO: 1,
    SPECOCC_GLOSSDEPENDENT: 2,

    SHADERDEF_NOSHADOW: 1,
    SHADERDEF_SKIN: 2,
    SHADERDEF_UV0: 4,
    SHADERDEF_UV1: 8,
    SHADERDEF_VCOLOR: 16,
    SHADERDEF_INSTANCING: 32,
    SHADERDEF_LM: 64,

    LINEBATCH_WORLD: 0,
    LINEBATCH_OVERLAY: 1,
    LINEBATCH_GIZMO: 2,

    SHADOWUPDATE_NONE: 0,
    SHADOWUPDATE_THISFRAME: 1,
    SHADOWUPDATE_REALTIME: 2
};

cc3d.SceneEnums = enums;

require('./CCCamera');
require('./CCGraphNode');
require('./CCMesh');
require('./CCScene');
require('./CCMaterial');
require('./CCBasicMaterial');
require('./CCLight');
require('./CCForwardRenderer');
require('./ShaderLib/CCShaderChunk');
