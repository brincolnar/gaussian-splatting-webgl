'''
This is just a helper program for visualization
'''
import struct
import matplotlib
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import numpy as np

def read_splat_file(filename):
    splats = []

    with open(filename, 'rb') as file:
        while chunk := file.read(32):
            data = struct.unpack('3f3f4B4b', chunk)

            position = data[:3]
            scale = data[3:6]

            color = data[6:10]

            rotation = [(c - 128) / 128.0 for c in data[10:]]

            splats.append({
                'position': position,
                'scale': scale,
                'color': color,
                'rotation': rotation
            })

    return splats

def visualize_splats_plotly(splats):
    positions = [splat['position'] for splat in splats]
    colors = [f'rgba({splat["color"][0]}, {splat["color"][1]}, {splat["color"][2]}, {splat["color"][3]/255.0})' for splat in splats]
    
    x, y, z = zip(*positions)
    
    trace = go.Scatter3d(
        x=x, y=y, z=z,
        mode='markers',
        marker=dict(
            size=5, 
            color=colors,  
            opacity=0.8
        )
    )

    layout = go.Layout(
        scene=dict(
            xaxis=dict(title='X Position'),
            yaxis=dict(title='Y Position'),
            zaxis=dict(title='Z Position')
        ),
        margin=dict(r=0, b=0, l=0, t=0)
    )
    
    fig = go.Figure(data=[trace], layout=layout)
    fig.show()

splats = read_splat_file('./data/nike.splat')

visualize_splats_plotly(splats)
