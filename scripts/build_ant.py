"""Rebuild the editable worker ant and glTF using D:/Blender/blender.exe -b -t 4 --python scripts/build_ant.py."""
import bpy, math, random, os
from mathutils import Vector
random.seed(41)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def material(name,color,rough,metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    return m
shell=material('Burnished chestnut cuticle',(0.047,0.021,0.011),.43,0)
joint=material('Amber joint membrane',(.18,.068,.019),.43)
eye=material('Obsidian compound eyes',(.008,.009,.006),.19)
hair=material('Fine golden setae',(.3,.2,.07),.8)
def uv(name,pos,scale,mat,segments=32,rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=pos)
    o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o
def tube(name,points,radius,mat):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=2;c.resolution_u=8
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for b,p in zip(s.bezier_points,points):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
    return o
# Blender Z is vertical; -Y becomes +Z in glTF. Face forward along +Y, exported -Z.
verts=[];faces=[]
# A single saddle-shaped mesosoma avoids the bead-on-a-string silhouette.
profile=[(-.45,.055,.045,.46),(-.39,.13,.12,.48),(-.25,.19,.17,.49),(-.10,.17,.14,.48),(.04,.19,.17,.50),(.18,.235,.21,.53),(.30,.23,.20,.54),(.40,.13,.12,.53),(.45,.05,.04,.51)]
for y,rx,rz,cz in profile:
    for i in range(32):
        a=i/32*math.tau;verts.append((math.cos(a)*rx,y,cz+math.sin(a)*rz))
for j in range(len(profile)-1):
    for i in range(32):faces.append((j*32+i,j*32+(i+1)%32,(j+1)*32+(i+1)%32,(j+1)*32+i))
faces.extend([tuple(reversed(range(32))),tuple((len(profile)-1)*32+i for i in range(32))])
mesh=bpy.data.meshes.new('Mesosoma continuous topology');mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new('Mesosoma saddle',mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(shell)
for p in mesh.polygons:p.use_smooth=True
bpy.context.view_layer.objects.active=obj;obj.select_set(True);modifier=obj.modifiers.new('Cuticle smoothing','SUBSURF');modifier.levels=2;bpy.ops.object.modifier_apply(modifier=modifier.name);obj.select_set(False)
uv('Petiolar node',(0,-.51,.49),(.105,.12,.19),joint)
g=uv('Gaster',(0,-.94,.48),(.36,.52,.32),shell,48,32)
uv('Head capsule',(0,.68,.53),(.31,.32,.26),shell,48,32)
for side in [-1,1]:
    uv('Compound eye '+str(side),(side*.276,.72,.62),(.075,.12,.10),eye,20,12)
    # Small convex facets make eye highlights break up at close range.
    for k in range(28):
        a=random.random()*math.tau;b=random.uniform(-.8,.8)
        uv('Ommatidium',(side*(.295+.025*math.cos(b)),.72+.09*math.sin(a)*math.cos(b),.62+.075*math.cos(a)),(.014,.014,.014),eye,6,4)
    tube('Mandible '+str(side),[(side*.15,.89,.44),(side*.23,1.04,.42),(side*.11,1.14,.43),(side*.035,1.06,.45)],.035,shell)
    tube('Antenna scape '+str(side),[(side*.14,.85,.66),(side*.33,1.01,.85),(side*.42,1.19,.86)],.018,joint)
    tube('Antenna funiculus '+str(side),[(side*.42,1.19,.86),(side*.30,1.45,.72),(side*.32,1.63,.62)],.012,shell)
    for k in range(7):uv('Antenna segment',(side*(.30+.02*k/7),1.43+.20*k/7,.73-.10*k/7),(.017,.018,.017),joint,8,6)
    for i,y in enumerate([.28,.03,-.23]):uv('Coxa '+str(side)+' '+str(i),(side*.22,y,.45),(.085,.095,.08),joint,16,10)
for i in range(180):
    a=random.random()*math.tau;b=random.uniform(-.9,.9);v=Vector((.36*math.cos(a)*math.cos(b),-.94+.52*math.sin(a)*math.cos(b),.48+.32*math.sin(b)))
    n=Vector((v.x/.36,(v.y+.94)/.52,(v.z-.48)/.32)).normalized()
    tube('Gaster seta',[v,v+n*random.uniform(.025,.055)],.0018,hair)
for k in range(3):
    y=-.70-k*.20
    tube('Gastral suture '+str(k),[(.31*math.sin(a),y,.48+.285*math.cos(a)) for a in [i*math.pi/12 for i in range(25)]],.0035,joint)
# Source contains body detail; six articulated runtime limbs use contact-driven IK.
bpy.ops.object.select_all(action='SELECT')
for obj in list(bpy.context.selected_objects):
    if obj.type=='CURVE':
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
os.makedirs(os.path.join(root,'public','assets'),exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'assets','worker-ant.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'public','assets','worker-ant.glb'),export_format='GLB',export_yup=True)
print('Worker ant source and GLB exported')
