import plotly.graph_objects as go

''' just for visualizing how splat looks '''
def visualize_splats_plotly(splats):
    positions = [splat['position'] for splat in splats]
    colors = [f'rgba({splat["color"][0]}, {splat["color"][1]}, {splat["color"][2]}, {splat["color"][3]/255.0})' for splat in splats]
    
    x, y, z = zip(*positions)
    
    trace = go.Scatter3d(
        x=x, y=y, z=z,
        mode='markers',
        marker=dict(
            size=5,  # Adjust marker size here
            color=colors,  # Set marker color to the RGBA values from splats
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

splats = [
{'position': (0.7570623755455017, 2.0546979904174805, 1.2185053825378418), 'color': (255, 0, 0, 255)}, 
{'position': (0.16322746872901917, 2.2229440212249756, 1.1478350162506104), 'color': (255, 0, 0, 255)},
{'position': (0.6, 2.1, -2.0), 'color': (255, 0, 0, 255)},
{'position': (0.6, 2.1, -3.0), 'color': (255, 255, 0, 255)}, # camera is yellow
]

visualize_splats_plotly(splats)
