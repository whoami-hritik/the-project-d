export function createloadingOverlay(scene){
    scene.loadOverlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.5)
        .setOrigin(0)
        .setDepth(105)
        .setScrollFactor(0)
        .setInteractive();

    scene.loadOverlay.on('pointerdown', () => {
        
    });

    scene.buffer = scene.add.image(scene.scale.width/2, scene.scale.height/2, "loading_buffer");
    scene.buffer.setScale(0.05).setDepth(105);


    const buffering = scene.tweens.add({
        targets: scene.buffer,
        angle: 360,
        duration: 1000,
        repeat: -1
    });

    buffering.play();

}
export function destroyloadingOverlay(scene){
    scene.loadOverlay.destroy();
    scene.buffer.destroy();
        
}